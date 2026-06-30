import { WinstonLogger } from "@/internal/config/winston";
import { NextFunction, Request, Response } from "express";

export class CORSMiddleware {
  private mode: string;
  private logger: WinstonLogger;
  private origins: string[] = [
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "https://mcs.rpd.my.id",
    "http://mcs.rpd.my.id",
  ];

  constructor(logger: WinstonLogger, mode: string) {
    this.logger = logger;
    this.mode = mode;

    this.register = this.register.bind(this);
  }

  private sanitizeOrigin(origin?: string): string {
    if (!origin && this.mode === "development") {
      return "*";
    }

    if (origin && this.origins.includes(origin)) {
      return origin;
    }

    return "";
  }

  public register(req: Request, res: Response, next: NextFunction) {
    const origin = this.sanitizeOrigin(req.get("origin"));
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Authorization, Access-Control-Allow-Origin",
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  }
}
