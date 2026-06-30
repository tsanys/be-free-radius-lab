import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { ServerStatusUseCase } from "@/internal/usecase/server-status.usecase";

export class ServerStatusJob {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private prefix: string;
  private serverStatusUseCase: ServerStatusUseCase;

  constructor(
    logger: WinstonLogger,
    rabbitmq: RabbitMQ,
    queue: QueueConfig,
    prefix: string,
    serverStatusUseCase: ServerStatusUseCase,
  ) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.prefix = prefix;
    this.serverStatusUseCase = serverStatusUseCase;

    this.register = this.register.bind(this);
  }

  public async register(): Promise<void> {
    try {
      this.logger.info("get server status starting");
      const { ping_ms, ping_status, cpu_usage_percetage, free_memory_mb, free_disk_mb, status_radius } =
        await this.serverStatusUseCase.getServerStatus({ host: "127.0.0.1" });

      this.rabbitmq.publish(this.queue.radius_server_status, {
        type: "update",
        data: {
          prefix: this.prefix,
          ping: ping_ms,
          status_ping: ping_status,
          resource_cpu: cpu_usage_percetage,
          resource_ram: free_memory_mb,
          resource_disk: free_disk_mb,
          status_radius,
        },
      });

      this.logger.info("get server status completed");
    } catch (error) {
      this.logger.error("failed to get server status", unkownErrorToString(error));
    }
  }
}
