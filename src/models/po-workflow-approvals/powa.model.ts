export class PowaModel {
  PONumber: string;
  SiteNumber: string;
  SiteName: string;
  type: string;
  dbname: string;
  projectId: string;
  jobNumber: string;
  SFVendorName: string;
  LastApproverName: string;
  MarketId: string;
  POTotal: number;
  PendingAccrualAmount: number;
  CreatedDate: Date;
  LastRevisionDate: Date;

  clone(): PowaModel {
    return Object.assign(new PowaModel(), this);
  }

}

export enum PowaType {
  PO = "PO",
  Closeout = "CLOSEOUT"
}