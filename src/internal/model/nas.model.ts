import { z } from "zod";

export interface NasResponse {
  id: number;
  nasname: string;
  shortname: string;
  type: string;
  ports: number;
  secret: string;
  server?: string | null;
  community?: string | null;
  description: string;
}

export interface NasStatusResponse {
  ssh_status: string;
  total_disk_mb: number;
  free_disk_mb: number;
  cpu_usage_percentage: number;
  total_memory_mb: number;
  free_memory_mb: number;
  ping_ms: number;
  ping_status: string;
  port_api_status: string;
}

export const EventNasRequestSchema = z.object({
  type: z.string(),
  data: z.object({}).catchall(z.any()),
});

export type EventNasRequest = z.infer<typeof EventNasRequestSchema>;

export const CreateNasRequestSchema = z.object({
  nasname: z.string(),
  shortname: z.string(),
  type: z.string(),
  ports: z.number(),
  secret: z.string(),
  server: z.string().nullable().optional(),
  community: z.string().nullable().optional(),
  description: z.string(),
});

export type CreateNasRequest = z.infer<typeof CreateNasRequestSchema>;

export const UpdateNasRequestSchema = z.object({
  nasname_old: z.string(),
  nasname: z.string(),
  shortname: z.string(),
  type: z.string(),
  ports: z.number(),
  secret: z.string(),
  server: z.string().nullable().optional(),
  community: z.string().nullable().optional(),
  description: z.string(),
});

export type UpdateNasRequest = z.infer<typeof UpdateNasRequestSchema>;

export const DeleteNasRequestSchema = z.object({
  nasname: z.string(),
});

export type DeleteNasRequest = z.infer<typeof DeleteNasRequestSchema>;

export const JobNasRequestSchema = z.object({
  host: z.string(),
  community: z.string(),
  port_authentication: z.number(),
  port_accounting: z.number(),
  port_api: z.number(),
  port_ssh: z.number(),
  username: z.string(),
  password: z.string(),
  type: z.string(),
});

export type JobNasRequest = z.infer<typeof JobNasRequestSchema>;
