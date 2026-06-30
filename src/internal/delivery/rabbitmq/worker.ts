import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { RadiusUserWorker } from "./radius-user.worker";
import { RadiusGroupWorker } from "./radius-group.worker";
import { RadiusNasWorker } from "./radius-nas.worker";
import { RadiusCleanupWorker } from "./radius-cleanup.worker";

export interface RabbitMQWorkerConfig {
  rabbitmq: RabbitMQ;
  queue: QueueConfig;
  radiusUserWorker: RadiusUserWorker;
  radiusGroupWorker: RadiusGroupWorker;
  radiusNasWorker: RadiusNasWorker;
  radiusCleanupWorker: RadiusCleanupWorker;
}

export class RabbitMQWorker {
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private radiusUserWorker: RadiusUserWorker;
  private radiusGroupWorker: RadiusGroupWorker;
  private radiusNasWorker: RadiusNasWorker;
  private radiusCleanupWorker: RadiusCleanupWorker;

  constructor(config: RabbitMQWorkerConfig) {
    this.rabbitmq = config.rabbitmq;
    this.queue = config.queue;
    this.radiusUserWorker = config.radiusUserWorker;
    this.radiusGroupWorker = config.radiusGroupWorker;
    this.radiusNasWorker = config.radiusNasWorker;
    this.radiusCleanupWorker = config.radiusCleanupWorker;
  }

  public setup() {
    this.rabbitmq.subscribe(this.queue.radius_user, this.radiusUserWorker.register);
    this.rabbitmq.subscribe(this.queue.radius_nas, this.radiusNasWorker.register);
    this.rabbitmq.subscribeBroadcast(this.queue.radius_group, this.radiusGroupWorker.register);
    this.rabbitmq.subscribeBroadcast(this.queue.radius_cleanup, this.radiusCleanupWorker.register);
  }
}
