import { z } from "zod";

export interface RadGroupCheckResponse {
  id: number;
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}

export const FindRadGroupChecksRequestSchema = z.object({
  page: z.number({ coerce: true }).min(1).optional().default(1),
  size: z.number({ coerce: true }).min(1).optional().default(10),
});

export type FindRadGroupChecksRequest = z.infer<typeof FindRadGroupChecksRequestSchema>;

export interface FindRadGroupChecksResponse {
  count: number;
  radgroupchecks: RadGroupCheckResponse[];
}

export const FindRadGroupCheckRequestSchema = z.object({
  id: z.string().uuid(),
});

export type FindRadGroupCheckRequest = z.infer<typeof FindRadGroupCheckRequestSchema>;

export const EventRadGroupCheckRequestSchema = z.object({
  type: z.string(),
  data: z.union([z.object({}).catchall(z.any()), z.array(z.object({}).catchall(z.any()))]),
});

export type EventRadGroupCheckRequest = z.infer<typeof EventRadGroupCheckRequestSchema>;

export const CreateRadGroupCheckRequestSchema = z.object({
  groupname: z.string(),
  poolname: z.string(),
  download_kbps: z.number(),
  upload_kbps: z.number(),
});

export type CreateRadGroupCheckRequest = z.infer<typeof CreateRadGroupCheckRequestSchema>;

export const CreateBulkRadGroupCheckRequestSchema = z.array(CreateRadGroupCheckRequestSchema);

export type CreateBulkRadGroupCheckRequest = z.infer<typeof CreateBulkRadGroupCheckRequestSchema>;

export const UpdateRadGroupCheckRequestSchema = z.object({
  groupname_old: z.string(),
  groupname: z.string(),
  poolname: z.string(),
  download_kbps: z.number(),
  upload_kbps: z.number(),
});

export type UpdateRadGroupCheckRequest = z.infer<typeof UpdateRadGroupCheckRequestSchema>;

export const DeleteRadGroupCheckRequestSchema = z.object({
  groupname: z.string(),
});

export type DeleteRadGroupCheckRequest = z.infer<typeof DeleteRadGroupCheckRequestSchema>;
