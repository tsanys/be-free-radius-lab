import { createLogger, format, Logger, LoggerOptions, transports } from "winston";
import { unkownErrorToString } from "../pkg/error.pkg";

export interface LogConfig extends LoggerOptions {}

export class WinstonLogger {
  private logger: Logger;

  constructor(config: LogConfig) {
    this.logger = createLogger({
      level: config.level,
      format: format.combine(format.timestamp(), format.json()),
      transports: [new transports.Console()],
    });
  }

  public info(...messages: (string | number)[]) {
    this.logger.info(messages.join(" "));
  }

  public error(...messages: (string | number)[]) {
    this.logger.error(messages.join(" "));
  }

  public unkownError(error: unknown) {
    this.error(unkownErrorToString(error));
  }

  public warn(...messages: (string | number)[]) {
    this.logger.warn(messages.join(" "));
  }

  public debug(...messages: (string | number)[]) {
    this.logger.debug(messages.join(" "));
  }
}
