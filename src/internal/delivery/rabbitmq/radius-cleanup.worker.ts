import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import { DeleteRadAcctRequest, DeleteRadAcctRequestSchema } from "@/internal/model/radacct.model";
import { DeleteRadPostAuthRequest, DeleteRadPostAuthRequestSchema } from "@/internal/model/radpostauth.model";
import { DeleteLogFilesRequest, DeleteLogFilesRequestSchema } from "@/internal/model/log.model";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { LooseObject } from "@/internal/pkg/object.pkg";
import { RadAcctUseCase } from "@/internal/usecase/radacct.usecase";
import { RadPostAuthUseCase } from "@/internal/usecase/radpostauth.usecase";
import { LogUseCase } from "@/internal/usecase/log.usecase";

export class RadiusCleanupWorker {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private radAcctUseCase: RadAcctUseCase;
  private radPostAuthUseCase: RadPostAuthUseCase;
  private logUseCase: LogUseCase;

  constructor(
    logger: WinstonLogger,
    rabbitmq: RabbitMQ,
    queue: QueueConfig,
    radAcctUseCase: RadAcctUseCase,
    radPostAuthUseCase: RadPostAuthUseCase,
    logUseCase: LogUseCase,
  ) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.radAcctUseCase = radAcctUseCase;
    this.radPostAuthUseCase = radPostAuthUseCase;
    this.logUseCase = logUseCase;

    this.register = this.register.bind(this);
  }

  public async register(message: LooseObject): Promise<void> {
    try {
      this.logger.info(this.queue.radius_cleanup, "cleanup worker message received", JSON.stringify(message));

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);

      this.logger.info(`starting cleanup for records older than 1 month(s):`, cutoffDate.toISOString());

      const radAcctRequest: DeleteRadAcctRequest = DeleteRadAcctRequestSchema.parse({ cutoffDate });
      const radPostAuthRequest: DeleteRadPostAuthRequest = DeleteRadPostAuthRequestSchema.parse({
        cutoffDate,
      });
      const logFilesRequest: DeleteLogFilesRequest = DeleteLogFilesRequestSchema.parse({
        cutoffDate,
        logDirectory: "logs",
      });

      const [radacctDeleted, radpostauthDeleted, logFilesDeleted] = await Promise.all([
        this.radAcctUseCase.deleteRadAcct(radAcctRequest),
        this.radPostAuthUseCase.deleteRadPostAuth(radPostAuthRequest),
        this.logUseCase.deleteLogFiles(logFilesRequest),
      ]);

      this.logger.info(
        this.queue.radius_cleanup,
        "cleanup worker completed",
        `radacct: ${radacctDeleted}, radpostauth: ${radpostauthDeleted}, log files: ${logFilesDeleted}`,
      );
    } catch (error) {
      this.logger.error(this.queue.radius_cleanup, "cleanup worker error", unkownErrorToString(error));
    }
  }
}
