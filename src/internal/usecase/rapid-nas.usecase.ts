import { WinstonLogger } from "@/internal/config/winston";
import { rapidNasToResponse } from "@/internal/infrastructure/converter/rapid-nas.converter";
import {
  CreateRapidNasRequest,
  DeleteRapidNasRequest,
  FindRapidNasRequest,
  RapidNasResponse,
  UpdateRapidNasRequest,
} from "@/internal/model/rapid-nas.model";
import { RapidNasRepository } from "@/internal/repository/rapid-nas.repository";
import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";

export class RapidNasUseCase {
  private db: Sequelize<PostgresDialect>;
  private logger: WinstonLogger;
  private rapidNasRepository: RapidNasRepository;

  constructor(db: Sequelize<PostgresDialect>, logger: WinstonLogger, rapidNasRepository: RapidNasRepository) {
    this.db = db;
    this.logger = logger;
    this.rapidNasRepository = rapidNasRepository;
  }

  async findRapidNas(request: FindRapidNasRequest): Promise<RapidNasResponse | null> {
    return this.db.transaction(async (trx) => {
      const rapidNas = await this.rapidNasRepository.findRapidNas(trx, request);
      if (!rapidNas) {
        return null;
      }

      return rapidNasToResponse(rapidNas);
    });
  }

  async createRapidNas(request: CreateRapidNasRequest): Promise<RapidNasResponse> {
    return this.db.transaction(async (trx) => {
      const rapidNas = await this.rapidNasRepository.createRapidNas(trx, request);

      return rapidNasToResponse(rapidNas);
    });
  }

  async updateRapidNas(request: UpdateRapidNasRequest): Promise<RapidNasResponse | null> {
    return this.db.transaction(async (trx) => {
      const [affectedCount, affectedRows] = await this.rapidNasRepository.updateRapidNas(
        trx,
        { nasname: request.nasname_old },
        request,
      );

      if (affectedCount === 0) {
        return null;
      }

      return rapidNasToResponse(affectedRows[0]);
    });
  }

  async deleteRapidNas(request: DeleteRapidNasRequest): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const deleted = await this.rapidNasRepository.deleteRapidNas(trx, { nasname: request.nasname });

      return deleted;
    });
  }
}
