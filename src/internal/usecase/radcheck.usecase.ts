import { WinstonLogger } from "@/internal/config/winston";
import { RadCheckRepository } from "@/internal/repository/radcheck.repository";
import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { radCheckToResponse } from "@/internal/infrastructure/converter/radcheck.converter";
import {
  CreateBulkRadCheckRequest,
  CreateRadCheckRequest,
  DeleteRadCheckRequest,
  RadCheckResponse,
  UpdateRadCheckRequest,
} from "../model/radcheck.model";
import { RadReplyRepository } from "../repository/radreply.repository";
import { RadUserGroupRepository } from "../repository/radusergroup.repository";
import { RadAcctRepository } from "../repository/radacct.repository";
import { RadPostAuthRepository } from "../repository/radpostauth.repository";

export class RadCheckUseCase {
  private db: Sequelize<PostgresDialect>;
  private logger: WinstonLogger;
  private radCheckRepository: RadCheckRepository;
  private radReplyRepository: RadReplyRepository;
  private radUserGroupRepository: RadUserGroupRepository;
  private radAcctRepository: RadAcctRepository;
  private radPostAuthRepository: RadPostAuthRepository;

  constructor(
    db: Sequelize<PostgresDialect>,
    logger: WinstonLogger,
    radCheckRepository: RadCheckRepository,
    radReplyRepository: RadReplyRepository,
    radUserGroupRepository: RadUserGroupRepository,
    radAcctRepository: RadAcctRepository,
    radPostAuthRepository: RadPostAuthRepository,
  ) {
    this.db = db;
    this.logger = logger;
    this.radCheckRepository = radCheckRepository;
    this.radReplyRepository = radReplyRepository;
    this.radUserGroupRepository = radUserGroupRepository;
    this.radAcctRepository = radAcctRepository;
    this.radPostAuthRepository = radPostAuthRepository;
  }

  populateRadCheck(request: CreateRadCheckRequest) {
    return {
      username: request.username,
      attribute: "Cleartext-Password",
      op: ":=",
      value: request.password,
    };
  }

  populateRadUserGroup(request: CreateRadCheckRequest) {
    return {
      username: request.username,
      groupname: request.groupname,
      priority: 1,
    };
  }

  async createRadCheck(request: CreateRadCheckRequest): Promise<RadCheckResponse> {
    return this.db.transaction(async (trx) => {
      const payloadRadCheck = this.populateRadCheck(request);
      const radCheck = await this.radCheckRepository.createRadCheck(trx, payloadRadCheck);

      if (request.status === "ACTIVE" || request.status === "ISOLIR") {
        const payloadRadUserGroup = this.populateRadUserGroup(request);
        await this.radUserGroupRepository.createRadUserGroup(trx, payloadRadUserGroup);
      }

      return radCheckToResponse(radCheck);
    });
  }

  async createBulkRadCheck(request: CreateBulkRadCheckRequest): Promise<RadCheckResponse[]> {
    return this.db.transaction(async (trx) => {
      const payloadRadChecks = request.map((item) => this.populateRadCheck(item));
      const radChecks = await this.radCheckRepository.createBulkRadCheck(trx, payloadRadChecks);

      for (const radUserGroup of request) {
        if (radUserGroup.status === "ACTIVE" || radUserGroup.status === "ISOLIR") {
          const payloadRadUserGroup = this.populateRadUserGroup(radUserGroup);
          await this.radUserGroupRepository.createRadUserGroup(trx, payloadRadUserGroup);
        }
      }

      return radChecks.map((radCheck) => radCheckToResponse(radCheck));
    });
  }

  async updateRadCheck(request: UpdateRadCheckRequest): Promise<RadCheckResponse | null> {
    return this.db.transaction(async (trx) => {
      const [affectedCount, affectedRows] = await this.radCheckRepository.updateRadCheck(
        trx,
        { username: request.username_old, attribute: "Cleartext-Password" },
        { username: request.username, value: request.password },
      );

      if (affectedCount === 0) {
        return null;
      }

      if (["ACTIVE", "ISOLIR"].includes(request.status)) {
        if (request.status_old === "DISMANTLE") {
          await this.radUserGroupRepository.createRadUserGroup(trx, {
            username: request.username,
            groupname: request.groupname,
            priority: 1,
          });
        } else {
          await this.radUserGroupRepository.updateRadUserGroup(
            trx,
            { username: request.username_old },
            { username: request.username, groupname: request.groupname },
          );
        }
      } else {
        await this.radUserGroupRepository.deleteRadUserGroup(trx, { username: request.username_old });
      }

      return radCheckToResponse(affectedRows[0]);
    });
  }

  async deleteRadCheck(request: DeleteRadCheckRequest): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const [deleted, ,] = await Promise.all([
        this.radCheckRepository.deleteRadCheck(trx, { username: request.username }),
        this.radAcctRepository.deleteRadAcct(trx, { username: request.username }),
        this.radPostAuthRepository.deleteRadPostAuth(trx, { username: request.username }),
      ]);

      if (deleted) {
        await this.radUserGroupRepository.deleteRadUserGroup(trx, { username: request.username });
      }

      return deleted;
    });
  }
}
