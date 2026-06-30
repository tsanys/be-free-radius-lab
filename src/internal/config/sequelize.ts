import { ModelStatic, Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { WinstonLogger } from "./winston";

export interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface SequelizeConfig {
  schema: string;
  primary: PoolConfig;
  slave: PoolConfig;
}

export class AppSequelize {
  private sequelize: Sequelize<PostgresDialect>;
  private logger: WinstonLogger;

  constructor(config: SequelizeConfig, models: ModelStatic[], logger: WinstonLogger) {
    this.logger = logger;
    this.sequelize = new Sequelize({
      dialect: PostgresDialect,
      replication: {
        write: config.primary,
        read: [config.slave],
      },
      schema: config.schema,
      models,
    });
  }

  async connect(): Promise<Sequelize<PostgresDialect>> {
    await this.sequelize.sync();
    await this.sequelize.authenticate();
    this.logger.info("sequelizedb connected");
    return this.sequelize;
  }

  public close(): Promise<void> {
    return this.sequelize.close();
  }
}
