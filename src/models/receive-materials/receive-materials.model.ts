import { DateTime } from "ionic-angular";

export class ReceiveMaterialsModel {

  constructor() { }

  clone(): ReceiveMaterialsModel {
    return Object.assign(new ReceiveMaterialsModel(), this);
  }
}

export class POHeader {
  RecordID: string;
  CalloutNumber: string;
  PONumber: string;
  Status: string;
  JobNumber: string;
  SitePTN: string;
  SiteId: string;
}

export class POLine {
  POLineID: string;
  POLineName: string;
  POLineItemDescription: string;
  LocNumber: string;
  QtyRequired: number;
  QtyReceived: number;
  SerialTracked: string;
  LotTracked: string;
  DockDate: string;
}

export class POLinePost {
  Qty: number;
  POLineID: string;
  ItemSerial: string;
  ItemLot: string;
  InvLocID: string;
  LocNumber: string;
  PackingSlip: string;
  PONumber: string;
  ReceiptType: string;
}

export class POReceiptResponse {
  Qty: number;
  POLineID: string;
  ItemSerial: string;
  ItemLot: string;
  InvLocID: string;
  LocNumber: string;
  PackingSlip: string;
  Status: string;
  Message: string;
}

export class LocationItem {
  LocationID: string;
  LocationName: string;
}

export class RMSubModule {
  SMSID: number;
  SMDescription: string;
  ModuleID: number;
}
