import { WinstonLogger } from "@/internal/config/winston";
import { FindRadGroupRepliesRequest } from "@/internal/model/radgroupreply.model";
import { Attributes, CreationAttributes, Op, Transaction } from "@sequelize/core";
import { RadGroupReply } from "@/internal/infrastructure/sequelize/radgroupreply.model";

export class RadGroupReplyRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRadGroupReplies(
    trx: Transaction | null,
    request: FindRadGroupRepliesRequest,
  ): Promise<{ count: number; rows: RadGroupReply[] }> {
    const result = await RadGroupReply.findAndCountAll({
      raw: true,
      transaction: trx,
      offset: (request.page - 1) * request.size,
      limit: request.size,
    });

    return result;
  }

  async findRadGroupReply(
    trx: Transaction | null,
    where: Partial<Attributes<RadGroupReply>>,
  ): Promise<RadGroupReply | null> {
    const result = await RadGroupReply.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRadGroupReply(
    trx: Transaction | null,
    request: CreationAttributes<RadGroupReply>,
  ): Promise<RadGroupReply> {
    const [result] = await RadGroupReply.findOrCreate({
      where: { groupname: request.groupname, attribute: request.attribute },
      defaults: request,
      transaction: trx,
    });

    return result;
  }

  async createBulkRadGroupReply(
    trx: Transaction | null,
    request: CreationAttributes<RadGroupReply>[],
  ): Promise<RadGroupReply[]> {
    const filter = request.map((item) => ({ groupname: item.groupname, attribute: item.attribute }));
    const currents = await RadGroupReply.findAll({
      where: { [Op.or]: filter },
      transaction: trx,
    });

    const existings = new Set(currents.map((item) => `${item.groupname}::${item.attribute}`));
    const payload = request.filter((item) => !existings.has(`${item.groupname}::${item.attribute}`));
    const result = await RadGroupReply.bulkCreate(payload, { transaction: trx });

    return [...currents, ...result];
  }

  async updateRadGroupReply(
    trx: Transaction | null,
    where: Partial<Attributes<RadGroupReply>>,
    request: Partial<Attributes<RadGroupReply>>,
  ): Promise<[affectedCount: number, affectedRows: RadGroupReply[]]> {
    const result = await RadGroupReply.update(request, {
      where: where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRadGroupReply(trx: Transaction | null, where: Partial<Attributes<RadGroupReply>>): Promise<boolean> {
    const deletedCount = await RadGroupReply.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
