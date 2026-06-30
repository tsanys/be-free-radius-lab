import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import {
  CreateBulkRadCheckRequestSchema,
  CreateRadCheckRequestSchema,
  DeleteRadCheckRequestSchema,
  EventRadCheckRequestSchema,
  UpdateRadCheckRequestSchema,
} from "@/internal/model/radcheck.model";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { LooseObject } from "@/internal/pkg/object.pkg";
import { RadCheckUseCase } from "@/internal/usecase/radcheck.usecase";

export class RadiusUserWorker {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private radCheckUseCase: RadCheckUseCase;

  constructor(logger: WinstonLogger, rabbitmq: RabbitMQ, queue: QueueConfig, radCheckUseCase: RadCheckUseCase) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.radCheckUseCase = radCheckUseCase;

    this.register = this.register.bind(this);
  }

  private async createRadCheck(data: LooseObject) {
    const request = CreateRadCheckRequestSchema.parse(data);
    return this.radCheckUseCase.createRadCheck(request);
  }

  private async createBulkRadCheck(data: LooseObject) {
    const request = CreateBulkRadCheckRequestSchema.parse(data);
    return this.radCheckUseCase.createBulkRadCheck(request);
  }

  private async updateRadCheck(data: LooseObject) {
    const request = UpdateRadCheckRequestSchema.parse(data);
    return this.radCheckUseCase.updateRadCheck(request);
  }

  private async deleteRadCheck(data: LooseObject) {
    const request = DeleteRadCheckRequestSchema.parse(data);
    return this.radCheckUseCase.deleteRadCheck(request);
  }

  public async register(message: LooseObject): Promise<void> {
    try {
      this.logger.info(this.queue.radius_user, "worker message received", JSON.stringify(message));
      const request = EventRadCheckRequestSchema.parse(message);
      switch (request.type) {
        case "create":
          await this.createRadCheck(request.data);
          break;
        case "create_bulk":
          await this.createBulkRadCheck(request.data);
          break;
        case "update":
          await this.updateRadCheck(request.data);
          break;
        case "delete":
          await this.deleteRadCheck(request.data);
          break;
        default:
          this.logger.error(this.queue.radius_user, "unsupported worker type");
          break;
      }

      this.logger.info(this.queue.radius_user, "worker completed");
    } catch (error) {
      this.logger.error(this.queue.radius_user, "worker error", unkownErrorToString(error));
    }
  }
}
