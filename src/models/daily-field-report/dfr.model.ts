export class DfrModel {

  constructor() {
    this.ReportEmployees = new Array<CrewMember>();
  }

  ReportId: number;
  ReportDate: string;
  SubmittedDate: string;
  SubmittedUserDesc: string;
  Status: string;
  Site: {
    SiteName: string;
    SiteNumber: string;
  };
  SiteNumber: string;
  WorkTypeId: number;
  WorkPerformedCompleted: string;
  WorkPerformedCompletedAudioNote: string;
  WorkPerformedCompletedAudioNoteUser: string;
  ConsumablesComment: string;
  CascadeId: string;
  ProjectId: string;
  ReportEmployees: CrewMember[];
  ReportEmployeesSummary: any[];

  clone(): DfrModel {
    return Object.assign(new DfrModel(), this);
  }

}

export class CrewMember {
  constructor() {
    //Add properties in this way in order to not serialize them during JSON.stringify
    Object.defineProperty(this, 'Expanded', { value: false, writable: true });
    Object.defineProperty(this, 'Name', { value: 'Select employee', writable: true });
    Object.defineProperty(this, 'WorkedHours', { value: 'Select start/stop time', writable: true });
    Object.defineProperty(this, 'WorkedHoursValid', { value: false, writable: true });
    Object.defineProperty(this, 'PerDiem', { value: false, writable: true });
    Object.defineProperty(this, 'CanDrive', { value: false, writable: true });
    Object.defineProperty(this, 'WorkStart', { value: '', writable: true });
    Object.defineProperty(this, 'WorkStop', { value: '', writable: true });    
  }

  Id: number;
  EmployeeTypeId: number;
  IsSigned: boolean = false;
  StartTime: string;
  StopTime: string;
  PerDiemId: number;
  ReportemployeeSid: number;
  LunchDuration: number;
}

export enum DfrStatus {
  New = 1,
  Saved = 2,
  Submitted = 3,
  Approved = 4,
  Rejected = 5
}
