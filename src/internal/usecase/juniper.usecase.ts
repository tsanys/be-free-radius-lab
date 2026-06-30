import { Vendor } from "../config/vendor";

export class JuniperUsecase extends Vendor {
  public name = "juniper" as const;

  private getOids() {
    return {
      cpu: "1.3.6.1.4.1.2636.3.1.13.1.8.9.1.0.0",
      memoryTotal: "1.3.6.1.4.1.2636.3.1.13.1.10.9.1.0.0",
      memoryPercent: "1.3.6.1.4.1.2636.3.1.13.1.11.9.1.0.0",
      diskTotal: "1.3.6.1.4.1.2636.3.1.13.1.15.9.1.0.0",
    };
  }

  public async getNasCPUUsage(host: string, community: string) {
    const oids = this.getOids();
    const cpuValue = await this.snmpGetValue(host, community, oids.cpu);

    if (cpuValue === null) {
      return { cpu_usage_percentage: 0 };
    }

    return { cpu_usage_percentage: cpuValue };
  }

  public async getNasResource(host: string, community: string) {
    const oids = this.getOids();

    const [memPercent, memTotalBytes, diskTotalMb] = await Promise.all([
      this.snmpGetValue(host, community, oids.memoryPercent),
      this.snmpGetValue(host, community, oids.memoryTotal),
      oids.diskTotal ? this.snmpGetValue(host, community, oids.diskTotal) : Promise.resolve(null),
    ]);

    if (memPercent === null || memTotalBytes === null) {
      return { free_memory_mb: 0, total_memory_mb: 0, free_disk_mb: 0, total_disk_mb: 0 };
    }

    const totalMemMb = memTotalBytes / (1024 * 1024);
    const usedMemMb = (totalMemMb * memPercent) / 100;
    const freeMemMb = totalMemMb - usedMemMb;
    const totalDiskMb = diskTotalMb || 0;

    return {
      free_memory_mb: freeMemMb,
      total_memory_mb: totalMemMb,
      free_disk_mb: 0,
      total_disk_mb: totalDiskMb,
    };
  }
}
