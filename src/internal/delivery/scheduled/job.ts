import { CronConfig } from "@/internal/config/config";
import { scheduleJob } from "node-schedule";
import { ServerStatusJob } from "./server-status.job";
import { NasStatusJob } from "./nas-status.job";

export interface ScheduledJobConfig {
  cron: CronConfig;
  serverStatusJob: ServerStatusJob;
  nasStatusJob: NasStatusJob;
}

export class ScheduledJob {
  private cron: CronConfig;
  private serverStatusJob: ServerStatusJob;
  private nasStatusJob: NasStatusJob;

  constructor(config: ScheduledJobConfig) {
    this.cron = config.cron;
    this.serverStatusJob = config.serverStatusJob;
    this.nasStatusJob = config.nasStatusJob;
  }

  public setup() {
    scheduleJob(this.cron.nas_status, this.nasStatusJob.register);
    scheduleJob(this.cron.server_status, this.serverStatusJob.register);
  }
}
