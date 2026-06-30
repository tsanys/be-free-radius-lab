import { AppConfig } from "@/internal/config/config";
import { WinstonLogger } from "@/internal/config/winston";
import { json, urlencoded } from "body-parser";
import express, { Express, Request, Response } from "express";
import { Server } from "http";

export class AppExpress {
  public app: Express;
  private config: AppConfig;
  private logger: WinstonLogger;
  private server: Server | undefined;

  constructor(config: AppConfig, logger: WinstonLogger) {
    this.config = config;
    this.logger = logger;
    this.app = express();

    this.app.use(urlencoded({ extended: false }));
    this.app.use(json());

    this.app.get("/health", (req: Request, res: Response) => {
      res.json("OK");
    });
  }

  public start() {
    this.server = this.app.listen(this.config.port, () => {
      this.logger.info(`Server is running on http://localhost:${this.config.port}`);
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close((error) => {
        if (error) {
          this.logger.error("Server failed to close", error.toString());
        }
      });
    }
  }
}
