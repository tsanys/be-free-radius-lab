import { WinstonLogger } from "@/internal/config/winston";
import { nasToResponse } from "@/internal/infrastructure/converter/nas.converter";
import { NasRepository } from "@/internal/repository/nas.repository";
import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { Socket } from "net";
import { exec } from "node:child_process";
import {
  CreateNasRequest,
  DeleteNasRequest,
  JobNasRequest,
  NasResponse,
  NasStatusResponse,
  UpdateNasRequest,
} from "../model/nas.model";
import { unkownErrorToString } from "../pkg/error.pkg";
import { VendorUsecase } from "./vendor.usecase";

export class NasUseCase {
  private db: Sequelize<PostgresDialect>;
  private logger: WinstonLogger;
  private nasRepository: NasRepository;
  private vendorUsecase: VendorUsecase;

  constructor(
    db: Sequelize<PostgresDialect>,
    logger: WinstonLogger,
    nasRepository: NasRepository,
    vendorUsecase: VendorUsecase,
  ) {
    this.db = db;
    this.logger = logger;
    this.nasRepository = nasRepository;
    this.vendorUsecase = vendorUsecase;
  }

  private restartFreeRadius() {
    exec("sudo systemctl restart freeradius", (error, _, stderr) => {
      if (error || stderr) {
        this.logger.error("freeradius restart error: ", unkownErrorToString(error), stderr);
        return;
      }

      this.logger.info("freeradius restarted");
    });
  }

  async findNases(): Promise<NasResponse[]> {
    return this.db.transaction(async (trx) => {
      const nases = await this.nasRepository.findNases(trx, {});
      return nases.map((nas) => nasToResponse(nas));
    });
  }

  async createNas(request: CreateNasRequest): Promise<NasResponse> {
    return this.db.transaction(async (trx) => {
      const nas = await this.nasRepository.createNas(trx, request);

      this.restartFreeRadius();

      return nasToResponse(nas);
    });
  }

  async updateNas(request: UpdateNasRequest): Promise<NasResponse | null> {
    return this.db.transaction(async (trx) => {
      const [affectedCount, affectedRows] = await this.nasRepository.updateNas(
        trx,
        { nasname: request.nasname_old },
        request,
      );

      if (affectedCount === 0) {
        return null;
      }

      this.restartFreeRadius();

      return nasToResponse(affectedRows[0]);
    });
  }

  async deleteNas(request: DeleteNasRequest): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const deleted = await this.nasRepository.deleteNas(trx, { nasname: request.nasname });

      if (deleted) {
        this.restartFreeRadius();
      }

      return deleted;
    });
  }

  private checkPort(host: string, port: number): Promise<{ status: string; port: number }> {
    return new Promise((resolve, _) => {
      const socket = new Socket();

      socket.setTimeout(2000);

      socket.on("connect", () => {
        socket.destroy();
        resolve({ status: "UP", port });
      });

      socket.on("error", () => {
        resolve({ status: "ERROR", port });
      });

      socket.on("timeout", () => {
        resolve({ status: "TIMEOUT", port });
      });

      socket.on("close", () => {
        resolve({ status: "CLOSED", port });
      });

      socket.connect(port, host);
    });
  }

  private async checkSSH(host: string, port: number): Promise<{ ssh_status: string }> {
    const { status } = await this.checkPort(host, port);
    return { ssh_status: status };
  }

  private async checkPortApi(host: string, port: number): Promise<{ port_api_status: string }> {
    const { status } = await this.checkPort(host, port);
    return { port_api_status: status };
  }

  private pingHost(host: string): Promise<{ ping_ms: number; ping_status: string }> {
    return new Promise((resolve, _) => {
      exec(`ping -c 1 -W 2 ${host}`, (error, stdout, stderr) => {
        if (error || stderr) {
          return resolve({ ping_ms: 0, ping_status: "UNREACHABLE" });
        }

        const match = stdout.match(/time=(\d+\.\d+) ms/);

        if (match) {
          const pingTime = parseFloat(match[1]);
          return resolve({ ping_ms: pingTime, ping_status: "UP" });
        }

        resolve({ ping_ms: 0, ping_status: "DOWN" });
      });
    });
  }

  async getNasStatus(request: JobNasRequest): Promise<NasStatusResponse> {
    const [ssh, cpu, resource, ping, portApi] = await Promise.all([
      this.checkSSH(request.host, request.port_ssh),
      this.vendorUsecase.get(request.type).getNasCPUUsage(request.host, request.community),
      this.vendorUsecase.get(request.type).getNasResource(request.host, request.community),
      this.pingHost(request.host),
      this.checkPortApi(request.host, request.port_api),
    ]);

    return {
      ...cpu,
      ...ssh,
      ...resource,
      ...ping,
      ...portApi,
    };
  }
}
