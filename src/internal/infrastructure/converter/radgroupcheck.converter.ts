import { RadGroupCheckResponse } from "@/internal/model/radgroupcheck.model";
import { RadGroupCheck } from "@/internal/infrastructure/sequelize/radgroupcheck.model";

export function radGroupCheckToResponse(groupcheck: RadGroupCheck): RadGroupCheckResponse {
  return {
    id: groupcheck.id,
    groupname: groupcheck.groupname,
    attribute: groupcheck.attribute,
    op: groupcheck.op,
    value: groupcheck.value,
  };
}
