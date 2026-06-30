import { WinstonLogger } from "@/internal/config/winston";
import { QueueConfig } from "../config/config";
import { RabbitMQ } from "../config/rabbitmq";
import { DeleteRadPostAuthRequest, RadPostAuthRequest } from "../model/radpostauth.model";
import { RadPostAuthRepository } from "../repository/radpostauth.repository";
import { Sequelize, Op, WhereOptions } from "@sequelize/core";
import { RadPostAuth } from "../infrastructure/sequelize/radpostauth.model";

export class RadPostAuthUseCase {
  private db: Sequelize;
  private logger: WinstonLogger;
  private queue: QueueConfig;
  private rabbitmq: RabbitMQ;
  private radPostAuthRepository: RadPostAuthRepository;

  constructor(
    db: Sequelize,
    queue: QueueConfig,
    rabbitmq: RabbitMQ,
    logger: WinstonLogger,
    radPostAuthRepository: RadPostAuthRepository,
  ) {
    this.db = db;
    this.queue = queue;
    this.rabbitmq = rabbitmq;
    this.logger = logger;
    this.radPostAuthRepository = radPostAuthRepository;
  }

  publish(log: RadPostAuthRequest) {
    this.rabbitmq.publish(this.queue.radius_user_log, {
      type: "create",
      data: {
        ...log,
        timestamp: new Date(log.timestamp),
      },
    });
  }

  async deleteRadPostAuth(request: DeleteRadPostAuthRequest): Promise<number> {
    return this.db.transaction(async (trx) => {
      const where: WhereOptions<RadPostAuth> = {};

      if (request.cutoffDate) {
        where.authdate = {
          [Op.lt]: request.cutoffDate,
        };
      }

      const deletedCount = await this.radPostAuthRepository.deleteRadPostAuth(trx, where);

      this.logger.info(`deleted ${deletedCount} radpostauth records`);

      return deletedCount;
    });
  }
}
