import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import {
  CreateBulkRadGroupCheckRequestSchema,
  CreateRadGroupCheckRequestSchema,
  DeleteRadGroupCheckRequestSchema,
  EventRadGroupCheckRequestSchema,
  UpdateRadGroupCheckRequestSchema,
} from "@/internal/model/radgroupcheck.model";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { LooseObject } from "@/internal/pkg/object.pkg";
import { RadGroupCheckUseCase } from "@/internal/usecase/radgroupcheck.usecase";

export class RadiusGroupWorker {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private radGroupCheckUseCase: RadGroupCheckUseCase;

  constructor(
    logger: WinstonLogger,
    rabbitmq: RabbitMQ,
    queue: QueueConfig,
    radGroupCheckUseCase: RadGroupCheckUseCase,
  ) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.radGroupCheckUseCase = radGroupCheckUseCase;

    this.register = this.register.bind(this);
  }

  private async createRadGroupCheck(data: LooseObject) {
    const request = CreateRadGroupCheckRequestSchema.parse(data);
    return this.radGroupCheckUseCase.createRadGroupCheck(request);
  }

  private async createBulkRadGroupCheck(data: LooseObject) {
    const request = CreateBulkRadGroupCheckRequestSchema.parse(data);
    return this.radGroupCheckUseCase.createBulkRadGroupCheck(request);
  }

  private async updateRadGroupCheck(data: LooseObject) {
    const request = UpdateRadGroupCheckRequestSchema.parse(data);
    return this.radGroupCheckUseCase.updateRadGroupCheck(request);
  }

  private async deleteRadGroupCheck(data: LooseObject) {
    const request = DeleteRadGroupCheckRequestSchema.parse(data);
    return this.radGroupCheckUseCase.deleteRadGroupCheck(request);
  }

  public async register(message: LooseObject): Promise<void> {
    try {
      this.logger.info(this.queue.radius_group, "worker message received", JSON.stringify(message));
      const request = EventRadGroupCheckRequestSchema.parse(message);
      switch (request.type) {
        case "create":
          await this.createRadGroupCheck(request.data);
          break;
        case "create_bulk":
          await this.createBulkRadGroupCheck(request.data);
          break;
        case "update":
          await this.updateRadGroupCheck(request.data);
          break;
        case "delete":
          await this.deleteRadGroupCheck(request.data);
          break;
        default:
          this.logger.error(this.queue.radius_group, "unsupported worker type");
          break;
      }

      this.logger.info(this.queue.radius_group, "worker completed");
    } catch (error) {
      this.logger.error(this.queue.radius_group, "worker error", unkownErrorToString(error));
    }
  }
}
