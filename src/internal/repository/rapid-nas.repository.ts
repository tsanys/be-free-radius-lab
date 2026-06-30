import { WinstonLogger } from "@/internal/config/winston";
import { Attributes, CreationAttributes, Transaction } from "@sequelize/core";
import { RapidNas } from "@/internal/infrastructure/sequelize/rapid-nas.model";

export class RapidNasRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRapidNases(trx: Transaction | null, where: Partial<Attributes<RapidNas>>): Promise<RapidNas[]> {
    const result = await RapidNas.findAll({
      transaction: trx,
    });

    return result;
  }

  async findRapidNas(trx: Transaction | null, where: Partial<Attributes<RapidNas>>): Promise<RapidNas | null> {
    const result = await RapidNas.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRapidNas(trx: Transaction | null, request: CreationAttributes<RapidNas>): Promise<RapidNas> {
    const result = await RapidNas.create(request, { transaction: trx });

    return result;
  }

  async updateRapidNas(
    trx: Transaction | null,
    where: Partial<Attributes<RapidNas>>,
    request: Partial<Attributes<RapidNas>>,
  ): Promise<[affectedCount: number, affectedRows: RapidNas[]]> {
    const result = await RapidNas.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRapidNas(trx: Transaction | null, where: Partial<Attributes<RapidNas>>): Promise<boolean> {
    const deletedCount = await RapidNas.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
