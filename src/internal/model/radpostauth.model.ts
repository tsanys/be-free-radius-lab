import { z } from "zod";

interface Attribute {
  type: string;
  value: string[] | number[] | null;
}

export interface RadPostAuthEvent {
  "User-Name": Attribute;
  "NAS-IP-Address": Attribute;
  "NAS-Port": Attribute;
  "Service-Type": Attribute;
  "Framed-Protocol": Attribute;
  "Called-Station-Id": Attribute;
  "Calling-Station-Id": Attribute;
  "NAS-Identifier": Attribute;
  "NAS-Port-Type": Attribute;
  "Acct-Session-Id": Attribute;
  "Event-Timestamp": Attribute;
  "NAS-Port-Id": Attribute;
  "MS-CHAP-Challenge": Attribute;
  "MS-CHAP2-Response": Attribute;
  "Module-Failure-Message"?: Attribute;
}

export interface RadPostAuthRequest {
  reply: string;
  username: string;
  nas_ip_address: string;
  called_station_id: string;
  calling_station_id: string;
  nas_identifier: string;
  failure_message: string;
  timestamp: string;
}

export const DeleteRadPostAuthRequestSchema = z.object({
  id: z.number().int().positive().optional(),
  cutoffDate: z.coerce.date().optional(),
});

export type DeleteRadPostAuthRequest = z.infer<typeof DeleteRadPostAuthRequestSchema>;
