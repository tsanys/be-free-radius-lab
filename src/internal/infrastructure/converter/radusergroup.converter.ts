import { RadUserGroupResponse } from "@/internal/model/radusergroup.model";
import { RadUserGroup } from "@/internal/infrastructure/sequelize/radusergroup.model";

export function radUserGroupToResponse(usergroup: RadUserGroup): RadUserGroupResponse {
  return {
    id: usergroup.id,
    username: usergroup.username,
    groupname: usergroup.groupname,
    priority: usergroup.priority,
  };
}
