import { WinstonLogger } from "@/internal/config/winston";
import { FindRadChecksRequest } from "@/internal/model/radcheck.model";
import { Attributes, CreationAttributes, Op, Transaction } from "@sequelize/core";
import { RadCheck } from "@/internal/infrastructure/sequelize/radcheck.model";

export class RadCheckRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRadChecks(
    trx: Transaction | null,
    request: FindRadChecksRequest,
  ): Promise<{ count: number; rows: RadCheck[] }> {
    const result = await RadCheck.findAndCountAll({
      raw: true,
      transaction: trx,
      offset: (request.page - 1) * request.size,
      limit: request.size,
    });

    return result;
  }

  async findRadCheck(trx: Transaction | null, where: Partial<Attributes<RadCheck>>): Promise<RadCheck | null> {
    const result = await RadCheck.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRadCheck(trx: Transaction | null, request: CreationAttributes<RadCheck>): Promise<RadCheck> {
    const [result] = await RadCheck.findOrCreate({
      where: { username: request.username, attribute: request.attribute },
      defaults: request,
      transaction: trx,
    });

    return result;
  }

  async createBulkRadCheck(trx: Transaction | null, request: CreationAttributes<RadCheck>[]): Promise<RadCheck[]> {
    const filter = request.map((item) => ({ username: item.username, attribute: item.attribute }));
    const currents = await RadCheck.findAll({
      where: { [Op.or]: filter },
      transaction: trx,
    });

    const existings = new Set(currents.map((item) => `${item.username}::${item.attribute}`));
    const payload = request.filter((item) => !existings.has(`${item.username}::${item.attribute}`));
    const result = await RadCheck.bulkCreate(payload, { transaction: trx });

    return [...currents, ...result];
  }

  async updateRadCheck(
    trx: Transaction | null,
    where: Partial<Attributes<RadCheck>>,
    request: Partial<Attributes<RadCheck>>,
  ): Promise<[affectedCount: number, affectedRows: RadCheck[]]> {
    const result = await RadCheck.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRadCheck(trx: Transaction | null, where: Partial<Attributes<RadCheck>>): Promise<boolean> {
    const deletedCount = await RadCheck.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
