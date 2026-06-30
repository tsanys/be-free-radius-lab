import { WinstonLogger } from "@/internal/config/winston";
import { RadAcct } from "@/internal/infrastructure/sequelize/radacct.model";
import { Attributes, Transaction, WhereOptions } from "@sequelize/core";

export class RadAcctRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async deleteRadAcct(trx: Transaction | null, where: WhereOptions<Attributes<RadAcct>>): Promise<number> {
    const deletedCount = await RadAcct.destroy({
      where,
      transaction: trx,
    });

    return deletedCount;
  }
}
