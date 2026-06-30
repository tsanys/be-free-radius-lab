import { WinstonLogger } from "@/internal/config/winston";
import { FindRadUserGroupsRequest } from "@/internal/model/radusergroup.model";
import { Attributes, CreationAttributes, Transaction } from "@sequelize/core";
import { RadUserGroup } from "@/internal/infrastructure/sequelize/radusergroup.model";
import { defaults } from "pg";

export class RadUserGroupRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRadUserGroups(
    trx: Transaction | null,
    request: FindRadUserGroupsRequest,
  ): Promise<{ count: number; rows: RadUserGroup[] }> {
    const result = await RadUserGroup.findAndCountAll({
      raw: true,
      transaction: trx,
      offset: (request.page - 1) * request.size,
      limit: request.size,
    });

    return result;
  }

  async findRadUserGroup(
    trx: Transaction | null,
    where: Partial<Attributes<RadUserGroup>>,
  ): Promise<RadUserGroup | null> {
    const result = await RadUserGroup.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRadUserGroup(trx: Transaction | null, request: CreationAttributes<RadUserGroup>): Promise<RadUserGroup> {
    const [result] = await RadUserGroup.findOrCreate({
      where: { username: request.username },
      defaults: request,
      transaction: trx,
    });

    return result;
  }

  async createBulkRadUserGroup(
    trx: Transaction | null,
    request: CreationAttributes<RadUserGroup>[],
  ): Promise<RadUserGroup[]> {
    const filter = request.map((item) => item.username);
    const currents = await RadUserGroup.findAll({
      where: { username: filter },
      transaction: trx,
    });

    const existings = new Set(currents.map((item) => item.username));
    const payload = request.filter((item) => !existings.has(item.username));
    const result = await RadUserGroup.bulkCreate(payload, { transaction: trx });

    return [...currents, ...result];
  }

  async updateRadUserGroup(
    trx: Transaction | null,
    where: Partial<Attributes<RadUserGroup>>,
    request: Partial<Attributes<RadUserGroup>>,
  ): Promise<[affectedCount: number, affectedRows: RadUserGroup[]]> {
    const result = await RadUserGroup.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRadUserGroup(trx: Transaction | null, where: Partial<Attributes<RadUserGroup>>): Promise<boolean> {
    const deletedCount = await RadUserGroup.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
