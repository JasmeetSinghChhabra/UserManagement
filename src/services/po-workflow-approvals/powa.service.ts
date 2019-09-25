import { Injectable } from '@angular/core';
import { Api } from '../common/api.service';
import { AppService } from '../common/app.service';
import 'rxjs/add/operator/toPromise';
import { Headers, Http, RequestOptions } from '@angular/http';

@Injectable()
export class PowaService {

  constructor(private apiService: Api, private app: AppService , private http: Http) {
  }

  getPendingPOs(userId, type): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      userId: userId,
      type: type
    }
    return this.apiService.get("POWorkflowApproval/GetPendingApprovals" , params, options).toPromise();
  }


  getPOLines(type, poNumber, projectId): Promise<any> {
    var viewType;
    var approvalStatus;
    if (type == "PO"){
      viewType = "PO_Approval";
      approvalStatus = type;
    } else {
      viewType = "Closeout_Approval";
      approvalStatus = "Closeout";
    }
    let headers = new Headers({ 'Content-Type': 'application/json'});
    return this.apiService.post("POWorkflowApproval/GetCommonLineItems?viewType=" + viewType + "&poApprovalStatus=" + approvalStatus + "%20Waiting%20for%20my%20Approval&headerId="+ poNumber +"&projectId="+ projectId +"&moduleId="+ this.app.moduleId, 
    {
      "PageSize":50,
      "Skip":0,
      "Take":50
    }, 
    {
      headers: headers,
      withCredentials: true
    }).toPromise();
  }

  processApprovals(approve, powas, comment){
    let dtos = [];
    var projectId = powas[0].projectId;
    powas.forEach(powa => {
      let dto = this.buildDTO(powa, comment, approve? "Approved" : "Rejected");
      dtos.push(dto);
    });
    return this.submitAction(dtos, projectId);
  }

   buildDTO(powa, comment, apprStatus){
    return  {
      SiteNumber: powa.SiteNumber,
      PONumber: powa.PONumber,
      ApprStatus: apprStatus,
      ApprPOAmount: powa.POTotal,
      Comment: comment
    };
  }

  private submitAction(dtos, projectId){
    let headers = new Headers({ 'Content-Type': 'application/json',
    "X-Requested-With": "XMLHttpRequest"  });
    return this.apiService.post("POWorkflowApproval/ValidateAndSubmitAction?viewTypeValue=PO_Approval&projectId="+ projectId +"&moduleId="+ this.app.moduleId, 
    dtos, 
    {
      headers: headers,
      withCredentials: true
    }).toPromise();
  }
}