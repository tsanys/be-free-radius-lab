import { z } from "zod";

export interface RadReplyResponse {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export const FindRadRepliesRequestSchema = z.object({
  page: z.number({ coerce: true }).min(1).optional().default(1),
  size: z.number({ coerce: true }).min(1).optional().default(10),
});

export type FindRadRepliesRequest = z.infer<typeof FindRadRepliesRequestSchema>;

export interface FindRadRepliesResponse {
  count: number;
  radreplies: RadReplyResponse[];
}

export const FindRadReplyRequestSchema = z.object({
  id: z.string().uuid(),
});

export type FindRadReplyRequest = z.infer<typeof FindRadReplyRequestSchema>;

export const CreateRadReplyRequestSchema = z.object({
  username: z.string(),
  attribute: z.string(),
  op: z.string(),
  value: z.string(),
});

export type CreateRadReplyRequest = z.infer<typeof CreateRadReplyRequestSchema>;

export const UpdateRadReplyRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
  username: z.string(),
  attribute: z.string(),
  op: z.string(),
  value: z.string(),
});

export type UpdateRadReplyRequest = z.infer<typeof UpdateRadReplyRequestSchema>;

export const DeleteRadReplyRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
});

export type DeleteRadReplyRequest = z.infer<typeof DeleteRadReplyRequestSchema>;
