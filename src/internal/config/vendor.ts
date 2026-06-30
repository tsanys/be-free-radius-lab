import { exec } from "node:child_process";
import { VendorNasCPUUsage, VendorNasResource, VendorType } from "../model/vendor.model";

export abstract class Vendor {
  abstract readonly name: VendorType;

  abstract getNasCPUUsage(host: string, community: string): Promise<VendorNasCPUUsage>;

  abstract getNasResource(host: string, community: string): Promise<VendorNasResource>;

  protected snmpGetValue(host: string, community: string, oid: string): Promise<number | null> {
    return new Promise((resolve, _) => {
      exec(`snmpget -v2c -c ${community} ${host} ${oid} | awk '{print $NF}'`, (error, stdout, stderr) => {
        if (error || stderr) {
          return resolve(null);
        }

        const value = stdout.trim();

        if (value.includes("OID") || value.includes("No Such")) {
          return resolve(null);
        }

        const numValue = parseFloat(value);
        return resolve(isNaN(numValue) ? null : numValue);
      });
    });
  }

  protected snmpWalk(host: string, community: string, oid: string): Promise<number[]> {
    return new Promise((resolve, _) => {
      exec(`snmpwalk -v2c -c ${community} ${host} ${oid} | awk '{print $NF}'`, (error, stdout, stderr) => {
        if (error || stderr) {
          return resolve([]);
        }

        const cpuValues = stdout
          .trim()
          .split("\n")
          .map((line) => parseFloat(line))
          .filter((n) => !isNaN(n));

        resolve(cpuValues);
      });
    });
  }
}
