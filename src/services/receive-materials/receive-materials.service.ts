import { Injectable } from '@angular/core';
import { AuthService } from '../common/auth.service';
import { AppService } from '../common/app.service';
import { Api } from '../common/api.service';
//import { SafetyAuditModel, AccidentReportModel, SAQuestionnaire, AccidentInvestigation, AccidentWitness, SACrewCompliance, SANotes, SAGeneralContractor } from '../../models/models';
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';

@Injectable()
export class ReceiveMaterialsService {

  public requestResult: any;

  constructor(private apiService: Api, private app: AppService, private http: Http) {
  }

  postPOReceipt(poLineReceipt): Promise<any> {
    let headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });
    return this.apiService.post("LogisticsManagement/PostPOReceipt?projectId=" + this.app.projectId, poLineReceipt, requestOptions).toPromise();
  }

  siteSearch(searchString, searchCallout): Promise<any> {
    let options = {
      withCredentials: true
    };

    let params = {
      projectID: this.app.projectId,
      searchString: searchString,
      searchCallout: (searchCallout) ? searchCallout : ""
    };
    return this.apiService.get("LogisticsManagement/GetPurchaseOrders", params, options).toPromise();
  }

  getPurchaseOrdersByPONumber(poNumber): Promise<any> {

    let headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
    
    let options = {
      headers: headers,
      withCredentials: true
    };

    let params = {
      projectID : this.app.projectId,
      ponumber: poNumber
    };
    return this.apiService.get("LogisticsManagement/GetMaterialPurchaseOrders", params, options).toPromise();
  }

  getPODetails(poNumber : string, sitePTN : string) : Promise<any> {
    let options = {
      withCredentials: true
    };

    let params = {
      projectID: this.app.projectId,
      poNumber: poNumber,
      sitePTN: sitePTN
    };
    return this.apiService.get("LogisticsManagement/GetPOLines", params, options).toPromise();
  }

  getLocationList(poNumber: string, sitePTN: string): Promise<any> {
    let options = {
      withCredentials: true
    };

    let params = {
      projectID: this.app.projectId,
      poNumber: poNumber,
      sitePTN: sitePTN
    };
    return this.apiService.get("LogisticsManagement/GetPOLocations", params, options).toPromise();
  }

}
