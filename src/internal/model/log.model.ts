import { z } from "zod";

export const DeleteLogFilesRequestSchema = z.object({
  cutoffDate: z.coerce.date(),
  logDirectory: z.string().default("logs"),
});

export type DeleteLogFilesRequest = z.infer<typeof DeleteLogFilesRequestSchema>;
