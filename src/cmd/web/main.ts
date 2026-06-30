import { Bootstrap } from "@/internal/config/app";
import { YamlConfigLoader } from "@/internal/config/config";
import { AppExpress } from "@/internal/config/express";
import { GracefulShutdown } from "@/internal/config/graceful-shutdown";
import { AppSequelize } from "@/internal/config/sequelize";
import { WinstonLogger } from "@/internal/config/winston";
import { radiusModels, rapidRadiusModels } from "@/internal/infrastructure/sequelize";
import { resolve } from "path";

const configPath = resolve(__dirname, "../../../config.yaml");
const configLoader = new YamlConfigLoader(configPath);

const gracefulShutdown = new GracefulShutdown();

async function main() {
  const config = configLoader.load();
  const logger = new WinstonLogger(config.log);

  const dbRadius = new AppSequelize(config.database_radius, radiusModels, logger);
  const dbRapidRadius = new AppSequelize(config.database_rapid_radius, rapidRadiusModels, logger);
  const [poolRaidus, poolRapidRaidus] = await Promise.all([dbRadius.connect(), dbRapidRadius.connect()]);

  const express = new AppExpress(config.app, logger);

  const bootstrap = new Bootstrap({
    db_radius: poolRaidus,
    db_rapid_radius: poolRapidRaidus,
    app: express.app,
    logger,
    config,
  });

  bootstrap.setup();
  express.start();

  gracefulShutdown.register([
    {
      name: "database radius",
      fn: poolRaidus.close.bind(poolRaidus),
    },
    {
      name: "database rapid radius",
      fn: poolRapidRaidus.close.bind(poolRapidRaidus),
    },
    {
      name: "express",
      fn: express.stop.bind(express),
    },
  ]);

  gracefulShutdown.listen();
}

main().catch((error) => {
  console.log("application error: ", error);
  gracefulShutdown.shutdown();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
