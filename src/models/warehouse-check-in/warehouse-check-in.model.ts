import { DateTime } from "ionic-angular";

export class WarehouseCheckInModel {

  constructor() { }

  clone(): WarehouseCheckInModel {
    return Object.assign(new WarehouseCheckInModel(), this);
  }
}

export class WCISite {
  WOSID: number;
  SiteNumber: string;
  SiteID: string;
  GCName: string;
  CheckInName: string;
  CheckInPhone: string;
  CheckInEmail: string;
  CheckInDate: DateTime;
}

export class WCICheckIn {
  WOSID: number;
  CheckInName: string;
  CheckInPhone: string;
  CheckInEmail: string;
  CheckInDate: DateTime;
}