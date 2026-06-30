import { NasResponse } from "@/internal/model/nas.model";
import { Nas } from "@/internal/infrastructure/sequelize/nas.model";

export function nasToResponse(nas: Nas): NasResponse {
  return {
    id: nas.id,
    nasname: nas.nasname,
    shortname: nas.shortname,
    type: nas.type,
    ports: nas.ports,
    secret: nas.secret,
    server: nas.server,
    community: nas.community,
    description: nas.description,
  };
}
