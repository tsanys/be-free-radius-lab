import { RapidNasResponse } from "@/internal/model/rapid-nas.model";
import { RapidNas } from "@/internal/infrastructure/sequelize/rapid-nas.model";

export function rapidNasToResponse(rapidNas: RapidNas): RapidNasResponse {
  return {
    id: rapidNas.id,
    nasname: rapidNas.nasname,
    username: rapidNas.username,
    password: rapidNas.password,
    port_authentication: rapidNas.port_authentication,
    port_accounting: rapidNas.port_accounting,
    port_api: rapidNas.port_api,
    port_ssh: rapidNas.port_ssh,
  };
}
