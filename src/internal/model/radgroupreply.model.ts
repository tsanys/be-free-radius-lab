import { z } from "zod";

export interface RadGroupReplyResponse {
  id: number;
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}

export const FindRadGroupRepliesRequestSchema = z.object({
  page: z.number({ coerce: true }).min(1).optional().default(1),
  size: z.number({ coerce: true }).min(1).optional().default(10),
});

export type FindRadGroupRepliesRequest = z.infer<typeof FindRadGroupRepliesRequestSchema>;

export interface FindRadGroupRepliesResponse {
  count: number;
  radgroupreplies: RadGroupReplyResponse[];
}

export const FindRadGroupReplyRequestSchema = z.object({
  id: z.string().uuid(),
});

export type FindRadGroupReplyRequest = z.infer<typeof FindRadGroupReplyRequestSchema>;

export const CreateRadGroupReplyRequestSchema = z.object({
  groupname: z.string(),
  attribute: z.string(),
  op: z.string(),
  value: z.string(),
});

export type CreateRadGroupReplyRequest = z.infer<typeof CreateRadGroupReplyRequestSchema>;

export const UpdateRadGroupReplyRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
  groupname: z.string(),
  attribute: z.string(),
  op: z.string(),
  value: z.string(),
});

export type UpdateRadGroupReplyRequest = z.infer<typeof UpdateRadGroupReplyRequestSchema>;

export const DeleteRadGroupReplyRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
});

export type DeleteRadGroupReplyRequest = z.infer<typeof DeleteRadGroupReplyRequestSchema>;
