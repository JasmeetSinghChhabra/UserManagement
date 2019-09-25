import { Injectable } from '@angular/core';
import { AuthService } from '../common/auth.service';
import { AppService } from '../common/app.service';
import { Api } from '../common/api.service';
import { WarehouseCheckInModel, WCISite, WCICheckIn } from '../../models/models'
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import { ODataService, ODataServiceFactory } from "../odata/odata";
import { Observable } from 'rxjs/rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class WarehouseCheckInService {
//, private odataFactory: ODataServiceFactory
  constructor(private apiService: Api, private app: AppService, private http: Http) {
  }

  saveCheckIn(checkIn: WCICheckIn) : Promise<any> {
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });
    return this.apiService.post("WorkOrder/SaveWarehouseCheckIn?projectId=" + this.app.projectId, checkIn, requestOptions).toPromise();
  }

  siteSearch(searchText: string): Promise<any> {

    var todaysDate = new Date();
    let dateString = todaysDate.getFullYear() + "-" + this.addLeader(todaysDate.getMonth() + 1) + "-" + todaysDate.getDate();

    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      searchText: searchText,
      searchDate: dateString
    }
    return this.apiService.get("WorkOrder/GetWarehouseCheckInSite", params, options).toPromise();
  }

  getCheckInStatus(wosid: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      wosid : wosid
    }
    return this.apiService.get("WorkOrder/GetWarehouseCheckIn", params, options).toPromise();
  }

  getWarehouseLane(workOrderSid: number): Promise<any>{
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSid: workOrderSid
    }
    return this.apiService.get("WorkOrder/GetWarehouseLane", params, options).toPromise();
  }

  getWciDetails(wosid: number): Promise<any>{
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      wosid: wosid
    }
    return this.apiService.get("WorkOrder/GetWciDetails", params, options).toPromise();
  }

  addLeader(timeValue: number): string {
    if (timeValue < 10) {
      return "0" + timeValue.toString();
    }
    else {
      return timeValue.toString();
    }
  }
}
