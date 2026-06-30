import { Vendor } from "../config/vendor";

export class MikrotikUsecase extends Vendor {
  public name = "mikrotik" as const;

  private getOids() {
    return {
      cpu: "1.3.6.1.2.1.25.3.3.1.2",
      memoryTotal: "1.3.6.1.2.1.25.2.3.1.5.65536",
      memoryUsed: "1.3.6.1.2.1.25.2.3.1.6.65536",
      diskTotal: "1.3.6.1.2.1.25.2.3.1.5.131072",
      diskUsed: "1.3.6.1.2.1.25.2.3.1.6.131072",
    };
  }

  public async getNasCPUUsage(host: string, community: string) {
    const oids = this.getOids();
    const cpuValues = await this.snmpWalk(host, community, oids.cpu);

    if (cpuValues.length === 0) {
      return { cpu_usage_percentage: 0 };
    }

    const avgCpuUsage = cpuValues.reduce((sum, value) => sum + value, 0) / cpuValues.length;
    return { cpu_usage_percentage: avgCpuUsage };
  }

  public async getNasResource(host: string, community: string) {
    const oids = this.getOids();

    const [memTotal, memUsed, diskTotal, diskUsed] = await Promise.all([
      this.snmpGetValue(host, community, oids.memoryTotal),
      this.snmpGetValue(host, community, oids.memoryUsed),
      oids.diskTotal ? this.snmpGetValue(host, community, oids.diskTotal) : Promise.resolve(null),
      oids.diskUsed ? this.snmpGetValue(host, community, oids.diskUsed) : Promise.resolve(null),
    ]);

    if (memTotal === null || memUsed === null) {
      return { free_memory_mb: 0, total_memory_mb: 0, free_disk_mb: 0, total_disk_mb: 0 };
    }

    const totalMemMb = memTotal / 1024;
    const usedMemMb = memUsed / 1024;
    const freeMemMb = totalMemMb - usedMemMb;

    const totalDiskMb = diskTotal ? diskTotal / 1024 : 0;
    const usedDiskMb = diskUsed ? diskUsed / 1024 : 0;
    const freeDiskMb = totalDiskMb - usedDiskMb;

    return {
      free_memory_mb: freeMemMb,
      total_memory_mb: totalMemMb,
      free_disk_mb: freeDiskMb,
      total_disk_mb: totalDiskMb,
    };
  }
}
