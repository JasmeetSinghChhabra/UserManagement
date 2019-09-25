export class DviModel {

  constructor() {
    this.VehicleInspectionTrailerDetails = [];
    this.VehicleInspectionTrailerDetails.push({ TrailerNo: "" });
  }

  VehicleInspectionId: number;
  ApprovedDate: string;
  ApprovedUser: any;
  ConditionSatisfactory: boolean;
  CorrectedDefects: boolean;
  DriverId: number;
  DriverSignature: any;
  DriverSignatureDate: any;
  DviStatusId: string;
  FirstCreatedDate: string;
  FirstCreatedUser: string;
  InspectionAddress: string;
  InspectionCarrier: string;
  InspectionDate: string;
  InspectionStatus: string;
  InspectionTime: string;
  IsDriverSigned: boolean;
  IsMechanicSigned: boolean;
  LastModifiedDate: string;
  LastModifiedUser: any;
  MechanicName: string;
  MechanicSignature: any;
  MechanicSignatureDate: any;
  NotToBeCorrectedDefects: any;
  Odometer: any;
  RejectedDate: string;
  RejectedUser: any;
  Remarks: string;
  SavedDate: string;
  SavedUser: any;
  SubmittedDate: string;
  SubmittedUser: string;
  TruckNo: string;
  VehicleInspectionTruck: any;
  VehicleInspectionComponentDetails: any[];
  VehicleInspectionTrailerDetails: any[];
  
  clone(): DviModel {
    return Object.assign(new DviModel(), this);
  }

}

export enum DviStatus {
  New = 1,
  Saved = 2,
  Submitted = 3
}
