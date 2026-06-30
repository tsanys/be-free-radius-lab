import { WinstonLogger } from "@/internal/config/winston";
import { FindRadRepliesRequest } from "@/internal/model/radreply.model";
import { Attributes, CreationAttributes, Transaction } from "@sequelize/core";
import { RadReply } from "@/internal/infrastructure/sequelize/radreply.model";

export class RadReplyRepository {
  protected logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async findRadReplies(
    trx: Transaction | null,
    request: FindRadRepliesRequest,
  ): Promise<{ count: number; rows: RadReply[] }> {
    const result = await RadReply.findAndCountAll({
      raw: true,
      transaction: trx,
      offset: (request.page - 1) * request.size,
      limit: request.size,
    });

    return result;
  }

  async findRadReply(trx: Transaction | null, where: Partial<Attributes<RadReply>>): Promise<RadReply | null> {
    const result = await RadReply.findOne({
      where,
      transaction: trx,
    });

    return result;
  }

  async createRadReply(trx: Transaction | null, request: CreationAttributes<RadReply>): Promise<RadReply> {
    const result = await RadReply.create(request, { transaction: trx });

    return result;
  }

  async updateRadReply(
    trx: Transaction | null,
    where: Partial<Attributes<RadReply>>,
    request: Partial<Attributes<RadReply>>,
  ): Promise<[affectedCount: number, affectedRows: RadReply[]]> {
    const result = await RadReply.update(request, {
      where,
      returning: true,
      transaction: trx,
    });

    return result;
  }

  async deleteRadReply(trx: Transaction | null, where: Partial<Attributes<RadReply>>): Promise<boolean> {
    const deletedCount = await RadReply.destroy({
      where,
      transaction: trx,
    });

    return deletedCount > 0;
  }
}
