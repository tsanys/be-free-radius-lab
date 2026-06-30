import { readFileSync } from "fs";
import { load } from "js-yaml";
import { PoolConfig } from "./sequelize";
import { LogConfig } from "./winston";

export interface AppConfig {
  mode: string;
  name: string;
  host: string;
  port: string;
  secret: string;
  prefix: string;
}

export interface WebSocketConfig {
  port: number;
  cors_origin: string;
  redis_url: string;
}

export interface RabbitMQConfig {
  url: string;
  max_retry: number;
}

export interface ServiceConfig {
  ais_system_url: string;
}

export interface QueueConfig {
  radius_nas: string;
  radius_user: string;
  radius_user_status: string;
  radius_group: string;
  radius_connection: string;
  radius_server_status: string;
  radius_nas_status: string;
  radius_user_log: string;
  radius_cleanup: string;
}

export interface CronConfig {
  server_status: string;
  nas_status: string;
}

export interface DatabaseConfig {
  schema: string;
  primary: PoolConfig;
  slave: PoolConfig;
}

export interface Config {
  websocket: WebSocketConfig;
  app: AppConfig;
  database_radius: DatabaseConfig;
  database_rapid_radius: DatabaseConfig;
  service: ServiceConfig;
  rabbitmq: RabbitMQConfig;
  queue: QueueConfig;
  cron: CronConfig;
  log: LogConfig;
}

export class YamlConfigLoader {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public load(): Config {
    const fileContents = readFileSync(this.filePath, "utf8");
    const data = load(fileContents) as Config;
    return data;
  }
}
