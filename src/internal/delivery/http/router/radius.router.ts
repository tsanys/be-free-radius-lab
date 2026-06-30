import { WinstonLogger } from "@/internal/config/winston";
import { NextFunction, Request, Response, Router } from "express";
import { RadiusHandler } from "../radius.handler";

export class RadiusRouter {
  private logger: WinstonLogger;
  private radiusHandler: RadiusHandler;

  constructor(logger: WinstonLogger, radiusHandler: RadiusHandler) {
    this.logger = logger;
    this.radiusHandler = radiusHandler;
  }

  public register(router: Router) {
    router.post("/post-auth", async (req: Request, res: Response, next: NextFunction) => {
      return this.radiusHandler
        .postAuth(req)
        .then(() => res.status(200).json({ status: "OK" }))
        .catch(next);
    });

    router.post("/accounting", async (req: Request, res: Response, next: NextFunction) => {
      return this.radiusHandler
        .accounting(req)
        .then((result) => res.status(200).json(result))
        .catch(next);
    });

    router.post(
      "/user/:username/sessions/:acctUniqueSessionID",
      async (req: Request, res: Response, next: NextFunction) => {
        switch (req.query.action) {
          case "accounting":
            return this.radiusHandler
              .accounting(req, req.params.username, req.params.acctUniqueSessionID)
              .then((result) => res.status(200).json(result))
              .catch(next);
          default:
            return res.status(200).json({ status: "OK" });
        }
      },
    );

    router.post("/user/:username/mac/:calledStationID", async (req: Request, res: Response, next: NextFunction) => {
      switch (req.query.action) {
        case "post-auth":
          return this.radiusHandler
            .postAuth(req, req.params.username, req.params.calledStationID)
            .then((result) => res.status(200).json(result))
            .catch(next);
        default:
          return res.status(200).json({ status: "OK" });
      }
    });

    router.post("/user/:username/mac", async (req: Request, res: Response, next: NextFunction) => {
      switch (req.query.action) {
        case "post-auth":
          return this.radiusHandler
            .postAuth(req, req.params.username, req.params.calledStationID)
            .then((result) => res.status(200).json(result))
            .catch(next);
        default:
          return res.status(200).json({ status: "OK" });
      }
    });
  }
}
