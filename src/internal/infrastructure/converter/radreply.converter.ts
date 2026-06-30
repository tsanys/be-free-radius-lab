import { RadReplyResponse } from "@/internal/model/radreply.model";
import { RadReply } from "@/internal/infrastructure/sequelize/radreply.model";

export function radReplyToResponse(reply: RadReply): RadReplyResponse {
  return {
    id: reply.id,
    username: reply.username,
    attribute: reply.attribute,
    op: reply.op,
    value: reply.value,
  };
}
