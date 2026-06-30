interface Attribute {
  type: string;
  value: string[] | number[] | null;
}

export interface AccountingEvent {
  "User-Name": Attribute;
  "Acct-Status-Type": Attribute;
  "Acct-Session-Id": Attribute;
  "NAS-IP-Address": Attribute;
  "Called-Station-Id": Attribute;
  "Calling-Station-Id": Attribute;
  "Framed-IP-Address": Attribute;
  "Acct-Session-Time": Attribute;
  "Acct-Authentics": Attribute;
}

export interface AccountingRequest {
  username: string;
  acct_status_type: string;
  acct_session_id: string;
  called_station_id: string;
  calling_station_id: string;
  nas_ip_address: string;
  framed_ip_address: string;
  acct_session_time: string;
  acct_authentics: string;
}
