import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import {
  CreateNasRequestSchema,
  DeleteNasRequestSchema,
  EventNasRequestSchema,
  UpdateNasRequestSchema,
} from "@/internal/model/nas.model";
import {
  CreateRapidNasRequestSchema,
  DeleteRapidNasRequestSchema,
  UpdateRapidNasRequestSchema,
} from "@/internal/model/rapid-nas.model";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { LooseObject } from "@/internal/pkg/object.pkg";
import { NasUseCase } from "@/internal/usecase/nas.usecase";
import { RapidNasUseCase } from "@/internal/usecase/rapid-nas.usecase";

export class RadiusNasWorker {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private nasUseCase: NasUseCase;
  private rapidNasUseCase: RapidNasUseCase;

  constructor(
    logger: WinstonLogger,
    rabbitmq: RabbitMQ,
    queue: QueueConfig,
    nasUseCase: NasUseCase,
    rapidNasUseCase: RapidNasUseCase,
  ) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.nasUseCase = nasUseCase;
    this.rapidNasUseCase = rapidNasUseCase;

    this.register = this.register.bind(this);
  }

  private async createNas(data: LooseObject) {
    const nasRequest = CreateNasRequestSchema.parse({ ...data, ports: data.port_authentication });
    const rapidNasrequest = CreateRapidNasRequestSchema.parse(data);
    return Promise.all([this.nasUseCase.createNas(nasRequest), this.rapidNasUseCase.createRapidNas(rapidNasrequest)]);
  }

  private async updateNas(data: LooseObject) {
    const nasRequest = UpdateNasRequestSchema.parse({ ...data, ports: data.port_authentication });
    const rapidNasrequest = UpdateRapidNasRequestSchema.parse(data);
    return Promise.all([this.nasUseCase.updateNas(nasRequest), this.rapidNasUseCase.updateRapidNas(rapidNasrequest)]);
  }

  private async deleteNas(data: LooseObject) {
    const nasRequest = DeleteNasRequestSchema.parse(data);
    const rapidNasrequest = DeleteRapidNasRequestSchema.parse(data);
    return Promise.all([this.nasUseCase.deleteNas(nasRequest), this.rapidNasUseCase.deleteRapidNas(rapidNasrequest)]);
  }

  public async register(message: LooseObject): Promise<void> {
    try {
      this.logger.info(this.queue.radius_nas, "worker message received", JSON.stringify(message));
      const request = EventNasRequestSchema.parse(message);
      switch (request.type) {
        case "create":
          await this.createNas(request.data);
          break;
        case "update":
          await this.updateNas(request.data);
          break;
        case "delete":
          await this.deleteNas(request.data);
          break;
        default:
          this.logger.error(this.queue.radius_nas, "unsupported worker type");
          break;
      }

      this.logger.info(this.queue.radius_nas, "worker completed");
    } catch (error) {
      this.logger.error(this.queue.radius_nas, "worker error", unkownErrorToString(error));
    }
  }
}
