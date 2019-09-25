import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Helper } from '../../utils/app.helper';
import { Api } from '../common/api.service';
import { AppService } from '../common/app.service';
import { Observable } from 'rxjs/Observable'; 
import 'rxjs/add/operator/toPromise';
import { AppConfig } from '../../app/config/app.config';
import { DashboardModel } from '../../models/models';

@Injectable()
export class DashboardService {

  constructor(private apiService: Api, private helper: Helper, private app: AppService, private http: HttpClient, private config: AppConfig) {
  }

  getDashboardData(): Promise<any> {
    let options = {
      withCredentials: true,

    };
    let params = {
      projectId: this.app.projectId,
      moduleId: this.app.moduleId,
    }

    return this.apiService.get(`/ReportsAPI/GetDashboardData` , params, options).toPromise();
  }

  getPowerBiData(model: DashboardModel): Observable<any> {
    let options = {
      withCredentials: true
    };
    let params ={
      projectId: this.app.projectId,
      reportId: model.id ,
      type: model.type
    }
    return this.apiService.get(`/ReportsAPI/GetPowerBiData`, params, options);
  }

  getDemo(type: string): Observable<any> {
    if(type == "Dashboard") {
      return this.http.get("https://powerbilivedemobe.azurewebsites.net/api/Dashboards/SampleDashboard");
    } else if(type == "Tile"){
      return this.http.get("https://powerbilivedemobe.azurewebsites.net/api/Tiles/SampleTile");      
    } else if(type == "Report" || type == "ReportVisual"){
      return this.http.get("https://powerbilivedemobe.azurewebsites.net/api/Reports/SampleReport");
    }
    return null; 
  }

}