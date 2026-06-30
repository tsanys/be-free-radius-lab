import { WinstonLogger } from "@/internal/config/winston";
import { RadGroupCheckRepository } from "@/internal/repository/radgroupcheck.repository";
import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { radGroupCheckToResponse } from "@/internal/infrastructure/converter/radgroupcheck.converter";
import {
  CreateBulkRadGroupCheckRequest,
  CreateRadGroupCheckRequest,
  DeleteRadGroupCheckRequest,
  RadGroupCheckResponse,
  UpdateRadGroupCheckRequest,
} from "../model/radgroupcheck.model";
import { CustomError } from "../pkg/custom-error.pkg";
import { RadGroupReplyRepository } from "../repository/radgroupreply.repository";
import { RadUserGroupRepository } from "../repository/radusergroup.repository";

export class RadGroupCheckUseCase {
  private db: Sequelize<PostgresDialect>;
  private logger: WinstonLogger;
  private radGroupCheckRepository: RadGroupCheckRepository;
  private radGroupReplyRepository: RadGroupReplyRepository;
  private radUserGroupRepository: RadUserGroupRepository;

  constructor(
    db: Sequelize<PostgresDialect>,
    logger: WinstonLogger,
    radGroupCheckRepository: RadGroupCheckRepository,
    radGroupReplyRepository: RadGroupReplyRepository,
    radUserGroupRepository: RadUserGroupRepository,
  ) {
    this.db = db;
    this.logger = logger;
    this.radGroupCheckRepository = radGroupCheckRepository;
    this.radGroupReplyRepository = radGroupReplyRepository;
    this.radUserGroupRepository = radUserGroupRepository;
  }

  private populateRadGroupCheck(request: CreateRadGroupCheckRequest) {
    return {
      groupname: request.groupname,
      attribute: "Framed-Protocol",
      op: ":=",
      value: "PPP",
    };
  }

  private populateRadGroupReplies(request: CreateRadGroupCheckRequest) {
    const groupReplies = [
      {
        groupname: request.groupname,
        attribute: "Framed-Pool",
        op: ":=",
        value: request.poolname,
      },
    ];

    if (request.download_kbps !== 0 || request.upload_kbps !== 0) {
      // groupReplies.push({
      //   groupname: request.groupname,
      //   attribute: "Mikrotik-Rate-Limit",
      //   op: ":=",
      //   value: `${request.download_kbps}/${request.upload_kbps}`,
      // });
    }

    return groupReplies;
  }

  async createRadGroupCheck(request: CreateRadGroupCheckRequest): Promise<RadGroupCheckResponse> {
    return this.db.transaction(async (trx) => {
      const payload = this.populateRadGroupCheck(request);
      const radgroupcheck = await this.radGroupCheckRepository.createRadGroupCheck(trx, payload);

      const radGroupReplies = this.populateRadGroupReplies(request);
      await this.radGroupReplyRepository.createBulkRadGroupReply(trx, radGroupReplies);

      return radGroupCheckToResponse(radgroupcheck);
    });
  }

  async createBulkRadGroupCheck(request: CreateBulkRadGroupCheckRequest): Promise<RadGroupCheckResponse[]> {
    return this.db.transaction(async (trx) => {
      const payload = request.map((item) => this.populateRadGroupCheck(item));
      const radGroupChecks = await this.radGroupCheckRepository.createBulkRadGroupCheck(trx, payload);

      for (const radGroupReply of request) {
        const radGroupReplies = this.populateRadGroupReplies(radGroupReply);
        await this.radGroupReplyRepository.createBulkRadGroupReply(trx, radGroupReplies);
      }

      return radGroupChecks.map((radGroupCheck) => radGroupCheckToResponse(radGroupCheck));
    });
  }

  async updateRadGroupCheck(request: UpdateRadGroupCheckRequest): Promise<RadGroupCheckResponse> {
    return this.db.transaction(async (trx) => {
      const radGroupCheck = await this.radGroupCheckRepository.findRadGroupCheck(trx, {
        groupname: request.groupname_old,
      });

      if (radGroupCheck === null) {
        throw new CustomError("NotFound", "RadGroup not found");
      }

      const radGroupReplies = this.populateRadGroupReplies(request);
      for (const radGroupReply of radGroupReplies) {
        await this.radGroupReplyRepository.updateRadGroupReply(
          trx,
          { groupname: request.groupname_old, attribute: radGroupReply.attribute },
          radGroupReply,
        );
      }

      if (request.groupname_old !== request.groupname) {
        await Promise.all([
          this.radGroupCheckRepository.updateRadGroupCheck(
            trx,
            { id: radGroupCheck.id },
            { groupname: request.groupname },
          ),
          this.radUserGroupRepository.updateRadUserGroup(
            trx,
            { groupname: request.groupname_old },
            { groupname: request.groupname },
          ),
        ]);
      }

      return radGroupCheckToResponse(radGroupCheck);
    });
  }

  async deleteRadGroupCheck(request: DeleteRadGroupCheckRequest): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const deleted = await this.radGroupCheckRepository.deleteRadGroupCheck(trx, { groupname: request.groupname });

      if (deleted) {
        await Promise.all([
          this.radGroupReplyRepository.deleteRadGroupReply(trx, { groupname: request.groupname }),
          this.radUserGroupRepository.updateRadUserGroup(
            trx,
            { groupname: request.groupname },
            { groupname: "default" },
          ),
        ]);
      }

      return deleted;
    });
  }
}
