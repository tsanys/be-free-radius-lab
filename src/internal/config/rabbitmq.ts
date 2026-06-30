import amqp, { Channel, Connection, Message } from "amqplib";
import { randomUUID } from "crypto";
import { unkownErrorToString } from "../pkg/error.pkg";
import { LooseObject } from "../pkg/object.pkg";
import { RabbitMQConfig } from "./config";
import { WinstonLogger } from "./winston";

type MessageCallback = (message: LooseObject) => void | Promise<void>;

export class RabbitMQ {
  private config: RabbitMQConfig;
  private logger: WinstonLogger;
  private client: Connection | null = null;
  private channel: Channel | null = null;

  constructor(config: RabbitMQConfig, logger: WinstonLogger) {
    this.config = config;
    this.logger = logger;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<T | void> {
    const executeWithRetry = async (retryCount: number = 0): Promise<T | void> => {
      try {
        return await operation();
      } catch (error) {
        this.logger.error(context, "operation error", unkownErrorToString(error));

        if (retryCount <= maxRetries) {
          await this.sleep(delayMs);
          return executeWithRetry(retryCount + 1);
        }

        this.logger.error(context, "operation stopped after max retry");
      }
    };

    return executeWithRetry();
  }

  public async getClient(): Promise<Connection> {
    if (this.client) return this.client;

    this.client = await amqp.connect(this.config.url);

    this.client.on("close", () => {
      this.logger.error("RabbitMQ connection closed");
      this.client = null;
    });

    this.client.on("error", () => {
      this.logger.error("RabbitMQ connection error");
      this.client = null;
    });

    return this.client;
  }

  private async getChannel(retryCount: number = 0): Promise<Channel> {
    try {
      if (this.channel) return this.channel;

      const client = await this.getClient();
      this.channel = await client.createChannel();

      this.channel.on("close", () => {
        this.logger.error("RabbitMQ channel closed");
        this.channel = null;
      });

      this.channel.on("error", () => {
        this.logger.error("RabbitMQ channel error");
        this.channel = null;
      });

      return this.channel;
    } catch (error: unknown) {
      this.logger.error("RabbitMQ get channel error", unkownErrorToString(error));
      this.channel = null;
      this.client = null;

      if (retryCount <= 3) {
        await this.sleep(1000);
        return this.getChannel(retryCount + 1);
      }

      throw error;
    }
  }

  public publish(queue: string, message: LooseObject) {
    const publishOperation = async () => {
      const channel = await this.getChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
      this.logger.info(queue, "published", JSON.stringify(message));
    };

    this.withRetry(publishOperation, `publish ${queue}`, this.config.max_retry);
  }

  public async publishBroadcast(exchange: string, message: LooseObject) {
    const publishBroadcastOperation = async () => {
      const channel = await this.getChannel();
      await channel.assertExchange(exchange, "fanout", { durable: true });
      channel.publish(exchange, "", Buffer.from(JSON.stringify(message)), { persistent: true });
      this.logger.info(exchange, "exchange published", JSON.stringify(message));
    };

    this.withRetry(publishBroadcastOperation, `publish broadcast ${exchange}`, this.config.max_retry);
  }

  public async subscribe(queue: string, callback: MessageCallback) {
    const subscribeOperation = async () => {
      const channel = await this.getChannel();
      await channel.assertQueue(queue, { durable: true });
      await channel.consume(queue, (msg) => {
        if (msg === null) return;
        const message = msg.content.toString();

        try {
          callback(JSON.parse(message));
          channel.ack(msg);
          this.logger.info(queue, "message processed", JSON.stringify(message));
        } catch (error) {
          this.logger.info(queue, "handler error", message, unkownErrorToString(error));
          channel.nack(msg, false, true);
        }
      });

      channel.on("close", () => {
        this.logger.error(`Channel closed for ${queue}, resubscribing...`);
        this.channel = null;
        this.withRetry(subscribeOperation, `resubscribe ${queue}`, 999);
      });

      channel.on("error", (err) => {
        this.logger.error(`Channel error for ${queue}: ${err}`);
        this.channel = null;
        this.withRetry(subscribeOperation, `resubscribe ${queue}`, 999);
      });
    };

    this.withRetry(subscribeOperation, `subscribe ${queue}`, 999);
  }

  public async subscribeBroadcast(exchange: string, callback: MessageCallback) {
    const subscribeBroadcastOperation = async () => {
      const channel = await this.getChannel();
      await channel.assertExchange(exchange, "fanout", { durable: true });

      const { queue } = await channel.assertQueue("", { exclusive: true });
      await channel.bindQueue(queue, exchange, "");

      await channel.consume(queue, (msg) => {
        if (msg === null) return;
        const message = msg.content.toString();

        try {
          callback(JSON.parse(message));
          channel.ack(msg);
          this.logger.info(queue, "exchange message processed", message);
        } catch (error) {
          this.logger.info(exchange, "exchange handler error", message, unkownErrorToString(error));
          channel.nack(msg, false, true);
        }
      });

      channel.on("close", () => {
        this.logger.error(`Channel closed for ${exchange}, resubscribing...`);
        this.channel = null;
        this.withRetry(subscribeBroadcastOperation, `resubscribe broadcast ${exchange}`, 999);
      });

      channel.on("error", (err) => {
        this.logger.error(`Channel error for ${exchange}: ${err}`);
        this.channel = null;
        this.withRetry(subscribeBroadcastOperation, `resubscribe broadcast ${exchange}`, 999);
      });
    };

    this.withRetry(subscribeBroadcastOperation, `subscribe broadcast ${exchange}`, 999);
  }

  public async rpcRequest(queue: string, message: LooseObject): Promise<LooseObject> {
    return new Promise(async (resolve, reject) => {
      try {
        const channel = await this.getChannel();
        const correlationId = randomUUID();
        const { queue: replyQueue } = await channel.assertQueue("", { exclusive: true });

        const handleResponse = (msg: Message | null) => {
          if (msg && msg.properties.correlationId === correlationId) {
            resolve(JSON.parse(msg.content.toString()));
            channel.ack(msg);
          }
        };

        await channel.consume(replyQueue, handleResponse, { noAck: true });

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
          replyTo: replyQueue,
          correlationId,
          persistent: true,
        });

        this.logger.info(queue, "RPC request sent", JSON.stringify(message));
      } catch (error) {
        reject(error);
        this.logger.error(queue, "RPC request error", unkownErrorToString(error));
      }
    });
  }

  public async rpcReply(queue: string, handler: (message: LooseObject) => LooseObject | Promise<LooseObject>) {
    try {
      const channel = await this.getChannel();
      await channel.assertQueue(queue, { durable: true });

      await channel.consume(queue, async (msg) => {
        if (msg === null) return;

        const requestMessage = JSON.parse(msg.content.toString());
        let response: LooseObject;

        try {
          response = await handler(requestMessage);
        } catch (error) {
          this.logger.error(queue, "RPC handler error", unkownErrorToString(error));
          response = { error: "Internal Server Error" };
        }

        channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
          correlationId: msg.properties.correlationId,
          persistent: true,
        });

        channel.ack(msg);
        this.logger.info(queue, "RPC response sent", JSON.stringify(response));
      });
    } catch (error) {
      this.logger.error(queue, "RPC reply error", unkownErrorToString(error));
    }
  }

  public async close() {
    await Promise.allSettled([this.client?.close(), this.channel?.close()]);
  }
}
