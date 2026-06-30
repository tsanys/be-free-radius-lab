import { RadGroupReplyResponse } from "@/internal/model/radgroupreply.model";
import { RadGroupReply } from "@/internal/infrastructure/sequelize/radgroupreply.model";

export function radGroupReplyToResponse(groupreply: RadGroupReply): RadGroupReplyResponse {
  return {
    id: groupreply.id,
    groupname: groupreply.groupname,
    attribute: groupreply.attribute,
    op: groupreply.op,
    value: groupreply.value,
  };
}
