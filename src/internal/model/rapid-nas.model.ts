import { z } from "zod";

export interface RapidNasResponse {
  id: number;
  nasname: string;
  username: string;
  password: string;
  port_authentication: number;
  port_accounting: number;
  port_api: number;
  port_ssh: number;
}

export const FindRapidNasRequestSchema = z.object({
  nasname: z.string(),
});

export type FindRapidNasRequest = z.infer<typeof FindRapidNasRequestSchema>;

export const CreateRapidNasRequestSchema = z.object({
  nasname: z.string(),
  port_authentication: z.number(),
  port_accounting: z.number(),
  port_api: z.number(),
  port_ssh: z.number(),
  username: z.string(),
  password: z.string(),
});

export type CreateRapidNasRequest = z.infer<typeof CreateRapidNasRequestSchema>;

export const UpdateRapidNasRequestSchema = z.object({
  nasname_old: z.string(),
  nasname: z.string(),
  port_authentication: z.number(),
  port_accounting: z.number(),
  port_api: z.number(),
  port_ssh: z.number(),
  username: z.string(),
  password: z.string(),
});

export type UpdateRapidNasRequest = z.infer<typeof UpdateRapidNasRequestSchema>;

export const DeleteRapidNasRequestSchema = z.object({
  nasname: z.string(),
});

export type DeleteRapidNasRequest = z.infer<typeof DeleteRapidNasRequestSchema>;
