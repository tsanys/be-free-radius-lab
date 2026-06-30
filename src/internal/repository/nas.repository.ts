import { WinstonLogger } from "@/internal/config/winston";
import { Attributes, CreationAttributes, Transaction } from "@sequelize/core";
import { Nas } from "@/internal/infrastructure/sequelize/nas.model";

export class NasRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findNases(trx: Transaction | null, where: Partial<Attributes<Nas>>): Promise<Nas[]> {
    const result = await Nas.findAll({
      transaction: trx,
    });

    return result;
  }

  async findNas(trx: Transaction | null, where: Partial<Attributes<Nas>>): Promise<Nas | null> {
    const result = await Nas.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createNas(trx: Transaction | null, request: CreationAttributes<Nas>): Promise<Nas> {
    const result = await Nas.create(request, { transaction: trx });

    return result;
  }

  async updateNas(
    trx: Transaction | null,
    where: Partial<Attributes<Nas>>,
    request: Partial<Attributes<Nas>>,
  ): Promise<[affectedCount: number, affectedRows: Nas[]]> {
    const result = await Nas.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteNas(trx: Transaction | null, where: Partial<Attributes<Nas>>): Promise<boolean> {
    const deletedCount = await Nas.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
