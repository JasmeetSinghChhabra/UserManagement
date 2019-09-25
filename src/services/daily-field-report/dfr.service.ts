import { Injectable } from '@angular/core';

import { ODataService, ODataServiceFactory } from "../odata/odata";
import { AppService } from '../common/app.service';
import { DfrModel } from '../../models/models';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/rx';

@Injectable()
export class DfrService {

  public requestResult: any;
  private odataReports: ODataService<DfrModel>;
  private odataTemplates: ODataService<any>;

  constructor(private odataFactory: ODataServiceFactory, private app: AppService) {
    this.odataReports = this.odataFactory.CreateService<DfrModel>("Reports");
    this.odataReports.config.additionalReqOptions = this.app.getDefaultRequestOptions();
    //this.odataReports.config.omitProperties = ["ReportEmployees.Name", "ReportEmployees.CanDrive"];

    this.odataTemplates = this.odataFactory.CreateService("ReportsTemplates");
    this.odataTemplates.config.additionalReqOptions = this.app.getDefaultRequestOptions();
  }

  getDfrs(status: number, top: number, skip: number): Observable<DfrModel[]> {
    return this.odataReports
      .Query()
      .Expand("Site")
      .Select("ReportId,ReportDate,Status,Site/SiteNumber,Site/SiteName")
      .Top(top)
      .Skip(skip)
      .OrderBy("ReportDate desc")
      .Filter(`Status eq '${status}'`)
      .Exec();
  }

  getDfr(reportId: number): Observable<DfrModel> {
    let employeeSelect = "ReportEmployees/Id,ReportEmployees/ReportemployeeSid,ReportEmployees/LunchDuration,ReportEmployees/ReportId,ReportEmployees/EmployeeTypeId,ReportEmployees/StartTime,ReportEmployees/StopTime,ReportEmployees/PerDiemId,ReportEmployees/IsSigned,ReportEmployees/Employee/CanDrive,ReportEmployees/Employee/EmployeeName";
    return this.odataReports
      .Get(reportId.toString())
      .Expand("ReportEmployees,ReportEmployees/Employee")
      .Select(`ReportId,ReportDate,Status,SiteNumber,WorkTypeId,WorkPerformedCompleted,WorkPerformedCompletedAudioNote,WorkPerformedCompletedAudioNoteUser,ConsumablesComment,CascadeId,ProjectId,RejectedDate,RejectedUser,RejectReason,${employeeSelect}`)
      .Exec();
  }

  getDfrSummary(reportId: number): Observable<DfrModel> {
    let employeeSelect = "ReportEmployeesSummary/*,ReportEmployeesSummary/Sites/*";
    return this.odataReports
      .Get(reportId.toString())
      .Expand("ReportEmployeesSummary,ReportEmployeesSummary/Sites")
      .Select(`ReportId,ReportDate,Status,SiteNumber,ProjectId,SubmittedUserDesc,SubmittedDate,${employeeSelect}`)
      .Exec();
  }

  getTemplates(): Observable<any>{
    return this.odataTemplates
      .Get(null)
      .Expand("Employees,WorkTypes,EmployeeTypes,Diems,Sites")
      .Select("EmployeeTypes,Employees/EmployeeId,Employees/EmployeeName,Employees/CanDrive,WorkTypes,Diems,Sites/SiteNumber,Sites/SiteName,Sites/ProjectId")
      .Exec();
  }

  createDfr(dfr: DfrModel) {
    return this.odataReports.Post(dfr);
  }

  updateDfr(dfr: DfrModel) {
    return this.odataReports.Put(dfr, dfr.ReportId.toString());
  }

  saveOrUpdateDfr(dfr: DfrModel) {
    let options = this.odataReports.config.postRequestOptions;
    options.search.append("$expand", "ReportEmployees");
    if (dfr.ReportId == null) {
      return this.odataReports.Post(dfr, options);
    } else {
      options.headers.append("Prefer", "return-content");
      return this.odataReports.Put(dfr, dfr.ReportId.toString(), options);
    }
  }

  approveDfr(reportId: number, approveComment: string) {
    return this.odataReports.Patch({
      RejectReason: approveComment,
      Status: "Approved" 
    }, reportId.toString());
  }

  rejectDfr(reportId: number, rejectComment: string) {
    return this.odataReports.Patch({
      RejectReason: rejectComment,
      Status: "Rejected"
    }, reportId.toString());
  }
}
