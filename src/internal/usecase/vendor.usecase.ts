import { Vendor } from "../config/vendor";
import { WinstonLogger } from "../config/winston";
import { GenericUsecase } from "./generic.usecase";
import { JuniperUsecase } from "./juniper.usecase";
import { MikrotikUsecase } from "./mikrotik.usecase";
import { VyosUsecase } from "./vyos.usecase";

export class VendorUsecase {
  private logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  get(name: string): Vendor {
    const vendors: Record<string, Vendor> = {
      juniper: new JuniperUsecase(),
      mikrotik: new MikrotikUsecase(),
      vyos: new VyosUsecase(),
      generic: new GenericUsecase(),
      other: new GenericUsecase(),
    };

    const vendor = vendors[name];
    if (!vendor) {
      this.logger.warn(`Vendor '${name}' not found, using generic`);
      return vendors.generic;
    }

    this.logger.info(`Using vendor: ${name}`);
    return vendor;
  }
}
