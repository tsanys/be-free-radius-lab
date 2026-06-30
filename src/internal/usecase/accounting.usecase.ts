import { WinstonLogger } from "@/internal/config/winston";
import { QueueConfig } from "../config/config";
import { RabbitMQ } from "../config/rabbitmq";
import { AccountingRequest } from "../model/accounting.model";
import { LooseObject } from "../pkg/object.pkg";

export class AccountingUseCase {
  private logger: WinstonLogger;
  private queue: QueueConfig;
  private rabbitmq: RabbitMQ;

  constructor(queue: QueueConfig, rabbitmq: RabbitMQ, logger: WinstonLogger) {
    this.queue = queue;
    this.rabbitmq = rabbitmq;
    this.logger = logger;
  }

  populateIsConnected(statusType: string): boolean | null {
    switch (statusType) {
      case "Start":
        return true;
      case "Stop":
        return false;
      default:
        return null;
    }
  }

  publish(request: AccountingRequest) {
    const isConnected = this.populateIsConnected(request.acct_status_type);
    if (isConnected === null) {
      return;
    }

    const payload: LooseObject = {
      ...request,
      is_connected: isConnected,
    };

    if (isConnected) {
      Object.assign(payload, { last_disconnected_at: new Date() });
    } else {
      Object.assign(payload, { last_connected_at: new Date() });
    }

    this.rabbitmq.publish(this.queue.radius_user_status, {
      type: "update",
      data: payload,
    });
  }
}
