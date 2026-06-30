import { WinstonLogger } from "@/internal/config/winston";
import { DeleteRadAcctRequest } from "@/internal/model/radacct.model";
import { RadAcctRepository } from "@/internal/repository/radacct.repository";
import { Sequelize, Op, WhereOptions } from "@sequelize/core";
import { RadAcct } from "../infrastructure/sequelize/radacct.model";

export class RadAcctUseCase {
  private db: Sequelize;
  private logger: WinstonLogger;
  private radAcctRepository: RadAcctRepository;

  constructor(db: Sequelize, logger: WinstonLogger, radAcctRepository: RadAcctRepository) {
    this.db = db;
    this.logger = logger;
    this.radAcctRepository = radAcctRepository;
  }

  async deleteRadAcct(request: DeleteRadAcctRequest): Promise<number> {
    return this.db.transaction(async (trx) => {
      const where: WhereOptions<RadAcct> = {};

      if (request.cutoffDate) {
        where.acctupdatetime = {
          [Op.lt]: request.cutoffDate,
        };
      }

      const deletedCount = await this.radAcctRepository.deleteRadAcct(trx, where);

      this.logger.info(`deleted ${deletedCount} radacct records`);

      return deletedCount;
    });
  }
}
