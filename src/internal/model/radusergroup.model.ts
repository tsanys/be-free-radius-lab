import { z } from "zod";

export interface RadUserGroupResponse {
  id: number;
  username: string;
  groupname: string;
  priority: number;
}

export const FindRadUserGroupsRequestSchema = z.object({
  page: z.number({ coerce: true }).min(1).optional().default(1),
  size: z.number({ coerce: true }).min(1).optional().default(10),
});

export type FindRadUserGroupsRequest = z.infer<typeof FindRadUserGroupsRequestSchema>;

export interface FindRadUserGroupsResponse {
  count: number;
  radusergroups: RadUserGroupResponse[];
}

export const FindRadUserGroupRequestSchema = z.object({
  id: z.string().uuid(),
});

export type FindRadUserGroupRequest = z.infer<typeof FindRadUserGroupRequestSchema>;

export const CreateRadUserGroupRequestSchema = z.object({
  username: z.string(),
  groupname: z.string(),
  priority: z.number(),
});

export type CreateRadUserGroupRequest = z.infer<typeof CreateRadUserGroupRequestSchema>;

export const UpdateRadUserGroupRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
  username: z.string(),
  groupname: z.string(),
  priority: z.number(),
});

export type UpdateRadUserGroupRequest = z.infer<typeof UpdateRadUserGroupRequestSchema>;

export const DeleteRadUserGroupRequestSchema = z.object({
  id: z.number({ coerce: true }).min(1),
});

export type DeleteRadUserGroupRequest = z.infer<typeof DeleteRadUserGroupRequestSchema>;
