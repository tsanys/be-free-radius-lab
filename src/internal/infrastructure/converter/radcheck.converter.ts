import { RadCheckResponse } from "@/internal/model/radcheck.model";
import { RadCheck } from "@/internal/infrastructure/sequelize/radcheck.model";

export function radCheckToResponse(check: RadCheck): RadCheckResponse {
  return {
    id: check.id,
    username: check.username,
    attribute: check.attribute,
    op: check.op,
    value: check.value,
  };
}
