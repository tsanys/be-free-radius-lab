import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { Express } from "express";

import { HTTPRouter } from "../delivery/http/router/router";
import { Config } from "./config";
import { RabbitMQ } from "./rabbitmq";
import { WinstonLogger } from "./winston";
import { FileManager } from "./files";

// repository
import { NasRepository } from "../repository/nas.repository";
import { RadCheckRepository } from "../repository/radcheck.repository";
import { RadGroupCheckRepository } from "../repository/radgroupcheck.repository";
import { RadGroupReplyRepository } from "../repository/radgroupreply.repository";
import { RadReplyRepository } from "../repository/radreply.repository";
import { RadUserGroupRepository } from "../repository/radusergroup.repository";
import { RadAcctRepository } from "../repository/radacct.repository";
import { RadPostAuthRepository } from "../repository/radpostauth.repository";
import { RapidNasRepository } from "../repository/rapid-nas.repository";

// usecase
import { NasUseCase } from "../usecase/nas.usecase";
import { RadCheckUseCase } from "../usecase/radcheck.usecase";
import { RadGroupCheckUseCase } from "../usecase/radgroupcheck.usecase";
import { ServerStatusUseCase } from "../usecase/server-status.usecase";
import { VendorUsecase } from "../usecase/vendor.usecase";
import { LogUseCase } from "../usecase/log.usecase";

// middleware
import { CORSMiddleware } from "../delivery/http/middleware/cors.middleware";
import { ErrorHandlerMiddleware } from "../delivery/http/middleware/error-handler.middleware";

// worker
import { RabbitMQWorker } from "../delivery/rabbitmq/worker";
import { RadiusUserWorker } from "../delivery/rabbitmq/radius-user.worker";
import { RadiusGroupWorker } from "../delivery/rabbitmq/radius-group.worker";
import { RadiusNasWorker } from "../delivery/rabbitmq/radius-nas.worker";
import { RadiusCleanupWorker } from "../delivery/rabbitmq/radius-cleanup.worker";

// job
import { ScheduledJob } from "../delivery/scheduled/job";
import { ServerStatusJob } from "../delivery/scheduled/server-status.job";
import { NasStatusJob } from "../delivery/scheduled/nas-status.job";
import { RadiusHandler } from "../delivery/http/radius.handler";
import { RadiusRouter } from "../delivery/http/router/radius.router";
import { RadPostAuthUseCase } from "../usecase/radpostauth.usecase";
import { RapidNasUseCase } from "../usecase/rapid-nas.usecase";
import { AccountingUseCase } from "../usecase/accounting.usecase";
import { RadAcctUseCase } from "../usecase/radacct.usecase";

interface BootstrapConfig {
  db_radius: Sequelize<PostgresDialect>;
  db_rapid_radius: Sequelize<PostgresDialect>;
  app: Express;
  logger: WinstonLogger;
  config: Config;
}

export class Bootstrap {
  private router: HTTPRouter;
  private rabbitmqWorker: RabbitMQWorker;
  private scheduledJob: ScheduledJob;

  constructor(config: BootstrapConfig) {
    // rabbitmq
    const rabbitmq = new RabbitMQ(config.config.rabbitmq, config.logger);

    // file manager
    const fileManager = new FileManager(config.logger);

    // setup repositories
    const nasRepository = new NasRepository(config.logger);
    const radCheckRepository = new RadCheckRepository(config.logger);
    const radReplyRepository = new RadReplyRepository(config.logger);
    const radGroupCheckRepository = new RadGroupCheckRepository(config.logger);
    const radGroupReplyRepository = new RadGroupReplyRepository(config.logger);
    const radUserGroupRepository = new RadUserGroupRepository(config.logger);
    const radAcctRepository = new RadAcctRepository(config.logger);
    const radPostAuthRepository = new RadPostAuthRepository(config.logger);
    const rapidNasRepository = new RapidNasRepository(config.logger);

    // setup use cases
    const vendorUsecase = new VendorUsecase(config.logger);
    const radcheckUseCase = new RadCheckUseCase(
      config.db_radius,
      config.logger,
      radCheckRepository,
      radReplyRepository,
      radUserGroupRepository,
      radAcctRepository,
      radPostAuthRepository,
    );
    const radGroupCheckUseCase = new RadGroupCheckUseCase(
      config.db_radius,
      config.logger,
      radGroupCheckRepository,
      radGroupReplyRepository,
      radUserGroupRepository,
    );
    const nasUseCase = new NasUseCase(config.db_radius, config.logger, nasRepository, vendorUsecase);
    const serverStatusUseCase = new ServerStatusUseCase(config.logger);
    const radPostAuthUseCase = new RadPostAuthUseCase(
      config.db_radius,
      config.config.queue,
      rabbitmq,
      config.logger,
      radPostAuthRepository,
    );
    const rapidNasUseCase = new RapidNasUseCase(config.db_rapid_radius, config.logger, rapidNasRepository);
    const accountingUseCase = new AccountingUseCase(config.config.queue, rabbitmq, config.logger);
    const radAcctUseCase = new RadAcctUseCase(config.db_radius, config.logger, radAcctRepository);
    const logUseCase = new LogUseCase(config.logger, fileManager);

    // handler
    const radiusHandler = new RadiusHandler(config.logger, radPostAuthUseCase, accountingUseCase);

    // router
    const radiusRouter = new RadiusRouter(config.logger, radiusHandler);

    // setup middleware
    const errorHandlerMiddleware = new ErrorHandlerMiddleware(config.logger);
    const corsMiddleware = new CORSMiddleware(config.logger, config.config.app.mode);

    // worker
    const radiusUserWorker = new RadiusUserWorker(config.logger, rabbitmq, config.config.queue, radcheckUseCase);
    const radiusGroupWorker = new RadiusGroupWorker(config.logger, rabbitmq, config.config.queue, radGroupCheckUseCase);
    const radiusNasWorker = new RadiusNasWorker(
      config.logger,
      rabbitmq,
      config.config.queue,
      nasUseCase,
      rapidNasUseCase,
    );
    const radiusCleanupWorker = new RadiusCleanupWorker(
      config.logger,
      rabbitmq,
      config.config.queue,
      radAcctUseCase,
      radPostAuthUseCase,
      logUseCase,
    );

    // job
    const serverStatusJob = new ServerStatusJob(
      config.logger,
      rabbitmq,
      config.config.queue,
      config.config.app.prefix,
      serverStatusUseCase,
    );
    const nasStatusJob = new NasStatusJob(
      config.logger,
      rabbitmq,
      config.config.queue,
      config.config.app.prefix,
      nasUseCase,
      rapidNasUseCase,
    );

    this.router = new HTTPRouter({
      app: config.app,
      corsMiddleware,
      errorHandlerMiddleware,
      radiusRouter,
    });
    this.rabbitmqWorker = new RabbitMQWorker({
      rabbitmq,
      queue: config.config.queue,
      radiusUserWorker,
      radiusGroupWorker,
      radiusNasWorker,
      radiusCleanupWorker,
    });
    this.scheduledJob = new ScheduledJob({
      cron: config.config.cron,
      serverStatusJob,
      nasStatusJob,
    });
  }

  setup() {
    this.router.setup();
    this.rabbitmqWorker.setup();
    this.scheduledJob.setup();
  }
}
