import { z } from "zod";

export const VendorTypeSchema = z.enum(["juniper", "mikrotik", "vyos", "generic"]);

export type VendorType = z.infer<typeof VendorTypeSchema>;

export const VendorNasCPUUsageSchema = z.object({
  cpu_usage_percentage: z.number(),
});

export type VendorNasCPUUsage = z.infer<typeof VendorNasCPUUsageSchema>;

export const VendorNasResourceSchema = z.object({
  free_memory_mb: z.number(),
  total_memory_mb: z.number(),
  free_disk_mb: z.number(),
  total_disk_mb: z.number(),
});

export type VendorNasResource = z.infer<typeof VendorNasResourceSchema>;
