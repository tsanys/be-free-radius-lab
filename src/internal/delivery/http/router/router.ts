import { Express, Router } from "express";
import { CORSMiddleware } from "../middleware/cors.middleware";
import { ErrorHandlerMiddleware } from "../middleware/error-handler.middleware";
import { RadiusRouter } from "./radius.router";

export interface RouterConfig {
  app: Express;
  corsMiddleware: CORSMiddleware;
  errorHandlerMiddleware: ErrorHandlerMiddleware;
  radiusRouter: RadiusRouter;
}

export class HTTPRouter {
  private app: Express;
  private corsMiddleware: CORSMiddleware;
  private errorHandlerMiddleware: ErrorHandlerMiddleware;
  private radiusRouter: RadiusRouter;

  constructor(config: RouterConfig) {
    this.app = config.app;
    this.corsMiddleware = config.corsMiddleware;
    this.errorHandlerMiddleware = config.errorHandlerMiddleware;
    this.radiusRouter = config.radiusRouter;
  }

  public setup() {
    const router: Router = Router();

    // this.app.use(this.corsMiddleware.register);

    this.radiusRouter.register(router);

    this.app.use("/api", router);

    this.app.use(this.errorHandlerMiddleware.register);
  }
}
