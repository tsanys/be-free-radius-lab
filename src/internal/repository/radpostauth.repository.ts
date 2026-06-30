import { WinstonLogger } from "@/internal/config/winston";
import { RadPostAuth } from "@/internal/infrastructure/sequelize/radpostauth.model";
import { Attributes, Transaction, WhereOptions } from "@sequelize/core";

export class RadPostAuthRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async deleteRadPostAuth(trx: Transaction | null, where: WhereOptions<Attributes<RadPostAuth>>): Promise<number> {
    const deletedCount = await RadPostAuth.destroy({
      where,
      transaction: trx,
    });

    return deletedCount;
  }
}
