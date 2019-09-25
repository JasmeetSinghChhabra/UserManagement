import { Page } from "ionic-angular/navigation/nav-util";
import { DateTime } from "ionic-angular";

export class WorkOrderModel {

  constructor() {

  }

  WorkOrderSID: number;
  StatusSID: number;
  ProjectId: string;
  ScheduledStartDate: string;
  ScheduledEndDate: string;
  SiteNumber: string;
  SitePtn: string;
  SiteName: string;
  SiteId: string;
  SiteAddress: string;
  MarketID: string;
  AssignedUserSID: number;
  latitude: number;
  longitude: number;
  TypeSID: number;
  TypeDescription: string;
  DockReadyDate: string;
  PriorityDescription: string;
  PrioritySID: number;
  SalesOrders: string[];
  IsCheckedIn: boolean;
  PickupDate: Date;
  DockNumber: string;
  GCCompanyDescription: string;
  GCCompany?: number;
  LocationNumber: string;
  AssignedUserName: string;
  StagedLocation: string;
  FieldServiceEngineer: string;
  FieldServiceEngineerName: string;
  
  clone(): WorkOrderModel {
    return Object.assign(new WorkOrderModel(), this);
  }

}

export enum WorkOrderStatus {
  New = 8,
  Issued  = 12,
  InProgress = 7,
  Cancelled = 5,
  Completed = 6,
  KitInProgress = 22,
  FullyPicked = 23,
  PartiallyPicked = 24,
  PartiallyShipped = 25,
  QCApproved = 55,
  QCInProgress = 81,
  GCReview = 80,
  Shipped = 82
}

export enum WorkOrderTabs{
  Issued = "0",
  InProgress = "1",
  Completed = "2"
}

export enum WorkOrderStatusDesription {
  New = 'New',
  Issued  = 'Issued',
  InProgress = 'In Progress',
  Completed = 'Completed',
  KitInProgress = 'Kitting In Progress',
  FullyPicked = 'Fully Picked',
  PartiallyPicked = 'Partially Picked',
  PartiallyShipped = 'Partially Shipped',
  QCApproved = 'QC Approved',
  QCInProgress = 'QC In Progress',
  GCReview = 'GC Review',
  Shipped = 'Shipped'
}

export enum OFWOViewTypes {
  PickUnassigned = 1,
  PickAssigned  = 2,
  GCPickupUnassigned = 3,
  GCPickupAssigned = 4,
  All = 5,
  QC = 6
}

export enum WorkOrderTypes {
  TowerService = 10 ,
  OrderFulfillment = 11,
  GroundServiceCivil = 2000,
  GroundServicePowerPlant = 2001,
  GroundServiceSmallCell = 2002,
  GroundServiceIntegration = 2003
}

export class WorkOrderType{
  TypeDescription:string;
  TypeIcon: string;
  TypeSID: number;
  Page:Page;
}

export class WorkOrderCheckIn{
  WorkOrderCheckinSID: number;
  WorkOrderSID: number;
  IsCheckedIn: boolean;
  CheckedInLatitude: number;
  CheckedInLongitude: number;
  CheckedInDate: Date;
  CheckedInUserId: string;
  CheckedInUserName: string;
  CheckedOutLatitude: number;
  CheckedOutLongitude: number;
  CheckedOutDate: Date;
  CheckedOutUserId: string;
  CheckedOutUserName: string;
  UDFsTransposed : WorkOrderCheckInUDF
}

export class WorkOrderCheckInUDF{
  WorkOrderCheckinSID: number;
  NFSDLoginTicket: string;
  NFSDLogoutTicket: string;
  NFSDLoginScreenshotFileName: string;
  NFSDLogoutScreenshotFileName: string;
  EIM: string;
}


