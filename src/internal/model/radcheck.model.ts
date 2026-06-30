import { z } from "zod";

export interface RadCheckResponse {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export const FindRadChecksRequestSchema = z.object({
  page: z.number({ coerce: true }).min(1).optional().default(1),
  size: z.number({ coerce: true }).min(1).optional().default(10),
});

export type FindRadChecksRequest = z.infer<typeof FindRadChecksRequestSchema>;

export interface FindRadChecksResponse {
  count: number;
  radchecks: RadCheckResponse[];
}

export const FindRadCheckRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
});

export type FindRadCheckRequest = z.infer<typeof FindRadCheckRequestSchema>;

export const EventRadCheckRequestSchema = z.object({
  type: z.string(),
  data: z.union([z.object({}).catchall(z.any()), z.array(z.object({}).catchall(z.any()))]),
});

export type EventRadCheckRequest = z.infer<typeof EventRadCheckRequestSchema>;

export const CreateRadCheckRequestSchema = z.object({
  username: z.string(),
  status: z.string(),
  password: z.string(),
  groupname: z.string(),
});

export type CreateRadCheckRequest = z.infer<typeof CreateRadCheckRequestSchema>;

export const CreateBulkRadCheckRequestSchema = z.array(CreateRadCheckRequestSchema);

export type CreateBulkRadCheckRequest = z.infer<typeof CreateBulkRadCheckRequestSchema>;

export const UpdateRadCheckRequestSchema = z.object({
  username_old: z.string(),
  username: z.string(),
  status_old: z.string(),
  status: z.string(),
  password: z.string(),
  groupname: z.string(),
});

export type UpdateRadCheckRequest = z.infer<typeof UpdateRadCheckRequestSchema>;

export const DeleteRadCheckRequestSchema = z.object({
  username: z.string(),
});

export type DeleteRadCheckRequest = z.infer<typeof DeleteRadCheckRequestSchema>;
