import { z } from "zod";

export interface ServerStatusResponse {
  total_disk_mb: number;
  free_disk_mb: number;
  cpu_usage_percetage: number;
  total_memory_mb: number;
  free_memory_mb: number;
  ping_ms: number;
  ping_status: string;
  status_radius: string;
}

export const GetServerStatusRequestSchema = z.object({
  host: z.string(),
});

export type GetServerStatusRequest = z.infer<typeof GetServerStatusRequestSchema>;
