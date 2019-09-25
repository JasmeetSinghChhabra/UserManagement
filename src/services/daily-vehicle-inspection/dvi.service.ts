import { Injectable } from '@angular/core';

import { ODataService, ODataServiceFactory } from "../odata/odata";
import { AppService } from '../common/app.service';
import { DviModel } from '../../models/models';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/rx';

@Injectable()
export class DviService {

  public requestResult: any;
  private odataVehicleInspections: ODataService<DviModel>;
  private odataTemplates: ODataService<any>;

  constructor(private odataFactory: ODataServiceFactory, private app: AppService) {
    this.odataVehicleInspections = this.odataFactory.CreateService<DviModel>("VehicleInspections");
    this.odataVehicleInspections.config.additionalReqOptions = this.app.getDefaultRequestOptions();

    this.odataTemplates = this.odataFactory.CreateService("VehicleInspectionTemplates");
    this.odataTemplates.config.additionalReqOptions = this.app.getDefaultRequestOptions();
  }

  getDvis(status: number, top: number, skip: number): Observable<DviModel[]> {
    return this.odataVehicleInspections
      .Query()
      .Select("VehicleInspectionId,TruckNo,InspectionDate,DviStatusId")
      .Top(top)
      .Skip(skip)
      .OrderBy("InspectionDate desc")
      .Filter(`DviStatusId eq '${status}'`)
      .Exec();
  }

  getDvi(id: number): Observable<DviModel> {    
    return this.odataVehicleInspections
      .Get(id.toString())
      .Expand("VehicleInspectionComponentDetails,VehicleInspectionTrailerDetails,VehicleInspectionTruck")      
      .Exec();
  }

  createDfr(dvi: DviModel) {
    return this.odataVehicleInspections.Post(dvi);
  }

  saveOrUpdateDfr(dvi: DviModel) {
    let options = this.odataVehicleInspections.config.postRequestOptions;
    options.search.append("$expand", "VehicleInspectionComponentDetails,VehicleInspectionTrailerDetails,VehicleInspectionTruck");
    if (dvi.VehicleInspectionId == null) {
      return this.odataVehicleInspections.Post(dvi, options);
    } else {
      options.headers.append("Prefer", "return-content");
      return this.odataVehicleInspections.Put(dvi, dvi.VehicleInspectionId.toString(), options);
    }
  }

  updateDfr(dvi: DviModel) {
    return this.odataVehicleInspections.Put(dvi, dvi.VehicleInspectionId.toString());
  }

  getTemplates(): Observable<any> {
    return this.odataTemplates
      .Get(null)
      .Expand("VehicleInspectionTrucks,VehicleInspectionTrailers,VehicleInspectionTruckComponents,VehicleInspectionTrailerComponents,Employees")      
      .Exec();
  }
}