import { WinstonLogger } from "@/internal/config/winston";
import { FindRadGroupChecksRequest } from "@/internal/model/radgroupcheck.model";
import { Attributes, CreationAttributes, Op, Transaction } from "@sequelize/core";
import { RadGroupCheck } from "@/internal/infrastructure/sequelize/radgroupcheck.model";

export class RadGroupCheckRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRadGroupChecks(
    trx: Transaction | null,
    request: FindRadGroupChecksRequest,
  ): Promise<{ count: number; rows: RadGroupCheck[] }> {
    const result = await RadGroupCheck.findAndCountAll({
      raw: true,
      transaction: trx,
      offset: (request.page - 1) * request.size,
      limit: request.size,
    });

    return result;
  }

  async findRadGroupCheck(
    trx: Transaction | null,
    where: Partial<Attributes<RadGroupCheck>>,
  ): Promise<RadGroupCheck | null> {
    const result = await RadGroupCheck.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRadGroupCheck(
    trx: Transaction | null,
    request: CreationAttributes<RadGroupCheck>,
  ): Promise<RadGroupCheck> {
    const [result] = await RadGroupCheck.findOrCreate({
      where: { groupname: request.groupname, attribute: request.attribute },
      defaults: request,
      transaction: trx,
    });

    return result;
  }

  async createBulkRadGroupCheck(
    trx: Transaction | null,
    request: CreationAttributes<RadGroupCheck>[],
  ): Promise<RadGroupCheck[]> {
    const filter = request.map((item) => ({ groupname: item.groupname, attribute: item.attribute }));
    const currents = await RadGroupCheck.findAll({
      where: { [Op.or]: filter },
      transaction: trx,
    });

    const existings = new Set(currents.map((item) => `${item.groupname}::${item.attribute}`));
    const payload = request.filter((item) => !existings.has(`${item.groupname}::${item.attribute}`));
    const result = await RadGroupCheck.bulkCreate(payload, { transaction: trx });

    return [...currents, ...result];
  }

  async updateRadGroupCheck(
    trx: Transaction | null,
    where: Partial<Attributes<RadGroupCheck>>,
    request: Partial<Attributes<RadGroupCheck>>,
  ): Promise<[affectedCount: number, affectedRows: RadGroupCheck[]]> {
    const result = await RadGroupCheck.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRadGroupCheck(trx: Transaction | null, where: Partial<Attributes<RadGroupCheck>>): Promise<boolean> {
    const deletedCount = await RadGroupCheck.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
