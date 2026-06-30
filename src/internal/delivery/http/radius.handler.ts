import { WinstonLogger } from "@/internal/config/winston";
import { AccountingEvent, AccountingRequest } from "@/internal/model/accounting.model";
import { RadPostAuthEvent, RadPostAuthRequest } from "@/internal/model/radpostauth.model";
import { LooseObject } from "@/internal/pkg/object.pkg";
import { AccountingUseCase } from "@/internal/usecase/accounting.usecase";
import { RadPostAuthUseCase } from "@/internal/usecase/radpostauth.usecase";
import { Request } from "express";

export class RadiusHandler {
  private logger: WinstonLogger;
  private radPostAuthUseCase: RadPostAuthUseCase;
  private accountingUseCase: AccountingUseCase;

  constructor(logger: WinstonLogger, radPostAuthUseCase: RadPostAuthUseCase, accountingUseCase: AccountingUseCase) {
    this.logger = logger;
    this.radPostAuthUseCase = radPostAuthUseCase;
    this.accountingUseCase = accountingUseCase;

    this.postAuth = this.postAuth.bind(this);
    this.accounting = this.accounting.bind(this);
  }

  private getValue(key: string, event: LooseObject): string {
    const attribute = event[key as keyof LooseObject];
    return attribute && attribute.value ? attribute.value.join(",") : "";
  }

  private transformRadPostAuthEvent(event: RadPostAuthEvent): RadPostAuthRequest {
    const failure_message = this.getValue("Module-Failure-Message", event);

    return {
      reply: failure_message ? "Access-Reject" : "Access-Accept",
      username: this.getValue("User-Name", event),
      nas_ip_address: this.getValue("NAS-IP-Address", event),
      called_station_id: this.getValue("Called-Station-Id", event),
      calling_station_id: this.getValue("Calling-Station-Id", event),
      nas_identifier: this.getValue("NAS-Identifier", event),
      timestamp: this.getValue("Event-Timestamp", event),
      failure_message,
    };
  }

  async postAuth(req: Request, username?: string, calledStationID?: string): Promise<void> {
    this.logger.info("post-auth", JSON.stringify(req.body));
    const request = this.transformRadPostAuthEvent(req.body);
    this.radPostAuthUseCase.publish(request);
  }

  private transformAccountingEvent(event: AccountingEvent): AccountingRequest {
    return {
      acct_status_type: this.getValue("Acct-Status-Type", event),
      username: this.getValue("User-Name", event),
      nas_ip_address: this.getValue("NAS-IP-Address", event),
      called_station_id: this.getValue("Called-Station-Id", event),
      calling_station_id: this.getValue("Calling-Station-Id", event),
      acct_session_id: this.getValue("Acct-Session-Id", event),
      acct_session_time: this.getValue("Acct-Session-Time", event),
      framed_ip_address: this.getValue("Framed-IP-Address", event),
      acct_authentics: this.getValue("Acct-Authentic", event),
    };
  }

  async accounting(req: Request, username?: string, acctUniqueSessionID?: string): Promise<any> {
    this.logger.info("accounting", JSON.stringify(req.body));
    const request = this.transformAccountingEvent(req.body);
    this.accountingUseCase.publish(request);
  }
}
