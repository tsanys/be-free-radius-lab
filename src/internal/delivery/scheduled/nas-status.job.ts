import { QueueConfig } from "@/internal/config/config";
import { RabbitMQ } from "@/internal/config/rabbitmq";
import { WinstonLogger } from "@/internal/config/winston";
import { VendorType } from "@/internal/model/vendor.model";
import { unkownErrorToString } from "@/internal/pkg/error.pkg";
import { NasUseCase } from "@/internal/usecase/nas.usecase";
import { RapidNasUseCase } from "@/internal/usecase/rapid-nas.usecase";

export class NasStatusJob {
  private logger: WinstonLogger;
  private rabbitmq: RabbitMQ;
  private queue: QueueConfig;
  private prefix: string;
  private nasUseCase: NasUseCase;
  private rapidNasUseCase: RapidNasUseCase;

  constructor(
    logger: WinstonLogger,
    rabbitmq: RabbitMQ,
    queue: QueueConfig,
    prefix: string,
    nasUseCase: NasUseCase,
    rapidNasUseCase: RapidNasUseCase,
  ) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.queue = queue;
    this.prefix = prefix;
    this.nasUseCase = nasUseCase;
    this.rapidNasUseCase = rapidNasUseCase;

    this.register = this.register.bind(this);
  }

  public async register(): Promise<void> {
    try {
      this.logger.info("get nas status starting");

      const nases = await this.nasUseCase.findNases();
      for (const nas of nases) {
        let host = nas.nasname;
        const nasname = nas.nasname.split("/");
        if (nasname.length > 1) {
          host = nasname[0];
        }
        if (!nas.community) {
          this.logger.info("skipped get status nas:", nas.nasname, "don't have community");
          continue;
        }

        const rapidNas = await this.rapidNasUseCase.findRapidNas({ nasname: nas.nasname });
        if (!rapidNas) {
          this.logger.info("skipped get status nas:", nas.nasname, "don't have config port");
          continue;
        }

        const {
          ping_ms,
          ping_status,
          ssh_status,
          cpu_usage_percentage,
          free_memory_mb,
          free_disk_mb,
          port_api_status,
        } = await this.nasUseCase.getNasStatus({
          ...rapidNas,
          host,
          community: nas.community,
          type: nas.type as VendorType,
        });

        this.rabbitmq.publish(this.queue.radius_nas_status, {
          type: "update",
          data: {
            nasname: nas.nasname,
            ping: ping_ms,
            status_ping: ping_status,
            status_port_ssh: ssh_status,
            status_port_api: port_api_status,
            resource_cpu: cpu_usage_percentage,
            resource_ram: free_memory_mb,
            resource_disk: free_disk_mb,
          },
        });

        this.logger.info("update nas status", nas.nasname);
      }

      this.logger.info("get nas status completed");
    } catch (error) {
      this.logger.error("failed to get nas status", unkownErrorToString(error));
    }
  }
}
