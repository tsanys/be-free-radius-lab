import { z } from "zod";

export const DeleteRadAcctRequestSchema = z.object({
  id: z.number().int().positive().optional(),
  cutoffDate: z.coerce.date().optional(),
});

export type DeleteRadAcctRequest = z.infer<typeof DeleteRadAcctRequestSchema>;
