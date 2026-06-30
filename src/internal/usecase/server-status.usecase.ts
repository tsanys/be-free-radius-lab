import { WinstonLogger } from "@/internal/config/winston";
import { exec } from "node:child_process";
import { cpus, freemem, totalmem } from "node:os";
import { GetServerStatusRequest, ServerStatusResponse } from "../model/server-status.model";
import { unkownErrorToString } from "../pkg/error.pkg";

interface CpuTimes {
  user: number;
  nice: number;
  sys: number;
  idle: number;
  irq: number;
}

export class ServerStatusUseCase {
  private logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  private getDiskUsage(): Promise<{ total_disk_mb: number; free_disk_mb: number }> {
    return new Promise((resolve, _) => {
      exec("df -h --output=size,avail /", (error, stdout) => {
        if (error) {
          return resolve({
            total_disk_mb: 0,
            free_disk_mb: 0,
          });
        }

        const lines = stdout.trim().split("\n");
        const sizeAvail = lines[1].trim().split(/\s+/);

        const totalDiskGB = parseFloat(sizeAvail[0].replace("G", ""));
        const freeDiskGB = parseFloat(sizeAvail[1].replace("G", ""));

        resolve({
          total_disk_mb: totalDiskGB * 1024,
          free_disk_mb: freeDiskGB * 1024,
        });
      });
    });
  }

  private getMemoryUsage() {
    const freeMemory = freemem();
    const totalMemory = totalmem();

    return {
      total_memory_mb: totalMemory / (1024 * 1024),
      free_memory_mb: freeMemory / (1024 * 1024),
    };
  }

  private getCPUUsage(): { cpu_usage_percetage: number } {
    const cpuStats = cpus();

    let totalIdle = 0;
    let totalTick = 0;

    cpuStats.forEach((cpu) => {
      const times = cpu.times as CpuTimes;

      for (let time in times) {
        totalTick += times[time as keyof CpuTimes];
      }
      totalIdle += times.idle;
    });

    const idleDiff = totalIdle;
    const totalDiff = totalTick;

    return {
      cpu_usage_percetage: 100 - (idleDiff / totalDiff) * 100,
    };
  }

  private pingHost(host: string): Promise<{ ping_ms: number; ping_status: string }> {
    return new Promise((resolve, _) => {
      exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
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

  private getFreeRadiusStatus(): Promise<{ status_radius: string }> {
    return new Promise((resolve, _) => {
      exec("sudo systemctl status freeradius", (error, stdout, stderr) => {
        if (error || stderr) {
          this.logger.error("radius status error: ", unkownErrorToString(error), stderr);
          return resolve({ status_radius: "ERROR" });
        }

        if (stdout.includes("Active: active (running)")) {
          return resolve({ status_radius: "UP" });
        }

        if (stdout.includes("Active: inactive (dead)") || stdout.includes("Active: failed")) {
          return resolve({ status_radius: "DOWN" });
        }

        return resolve({ status_radius: "UKNOWN" });
      });
    });
  }

  public async getServerStatus(request: GetServerStatusRequest): Promise<ServerStatusResponse> {
    const [disk, cpu, memory, ping, radius] = await Promise.all([
      this.getDiskUsage(),
      this.getCPUUsage(),
      this.getMemoryUsage(),
      this.pingHost(request.host),
      this.getFreeRadiusStatus(),
    ]);

    return {
      ...disk,
      ...cpu,
      ...memory,
      ...ping,
      ...radius,
    };
  }
}
