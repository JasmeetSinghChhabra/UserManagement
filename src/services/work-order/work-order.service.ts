import { Injectable } from '@angular/core';
import { AuthService } from '../common/auth.service';
import { AppService } from '../common/app.service';
import { Api } from '../common/api.service';
import { WorkOrderModel, WorkOrderTypes } from '../../models/models';
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import { ODataService, ODataServiceFactory } from "../odata/odata";
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { Observable } from 'rxjs/rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {WorkOrderCheckInUDF, WorkOrderCheckIn } from '../../models/work-order/work-order.model';
import { PackedItem } from '../../models/work-order/order-fulfillment';
import { File } from '@ionic-native/file';

@Injectable()
export class WorkOrderService {

  constructor(private apiService: Api, private app: AppService, private http: Http, 
    private odataFactory: ODataServiceFactory, private file: File,
     private transfer: FileTransfer) {

  }

  getOFKitLocationNumbers(): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId
    };
    return this.apiService.get("WorkOrder/GetOFKitLocationNumbers", params, options).toPromise();
  }

  getOFWorkOrders(assigneeSid: number, viewType: number, top: number, skip: number): Promise<any> {
    let options = {
      withCredentials: true
    };

    let params = {
      projectId: this.app.projectId,
      assignedUserSid: assigneeSid,
      asNoTracking: true,
      viewType: viewType,
      skip: skip,
      top: top
    }
    return this.apiService.get("WorkOrder/GetOFWorkOrders", params, options).toPromise();
  }

  getCONWorkOrders(status: number, top: number, skip: number, isUserGC: boolean): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      isUserGC: isUserGC,
      asNoTracking: true,
      status: status,
      skip: skip,
      top: top
    }
    return this.apiService.get("WorkOrder/GetCONWorkOrdersByStatus", params, options).toPromise();
  }

  getWorkOrdersByTypeAndStatus(type: number, status: number, top: number, skip: number, isUserGC: boolean){ 
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      isUserGC: isUserGC,
      asNoTracking: true,
      type: type,
      status: status,
      skip: skip,
      top: top
    }
    return this.apiService.get("WorkOrder/GetWorkOrdersByTypeAndStatus", params, options).toPromise();
  }

  completePickup(workOrder: WorkOrderModel, status: number): Promise<any> {
    workOrder.AssignedUserSID = null;
    workOrder.StatusSID = status;

    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' ,
                               "Prefer": "return-content"});
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });
    return this.apiService.put("WorkOrder/SaveWorkOrder?projectId=" + this.app.projectId , workOrder, requestOptions).toPromise();
  }

  getStaticOFWorkOrderDetails(): Promise<any> {
    return this.http.get('assets/data/picklist.json')
      .map((response: Response) => response.json()).toPromise();
  }

  getOFWorkOrderDetails(workOrderSid: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSid: workOrderSid
    }
    return this.apiService.get("WorkOrder/GetOFWorkOrderDetails", params, options).toPromise();
  }

  getJobsAllowedForOFWorkOrderCreation(): Promise<any>{
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId
    }
    return this.apiService.get("WorkOrder/GetJobsAllowedForOFWorkOrderCreation", params, options).toPromise();
  }

  getSalesOrders(jobNumber: string): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      jobNumber: jobNumber
    }
    return this.apiService.get("WorkOrder/GetSalesOrders", params, options).toPromise();
  }

  getWorkOrderBySid(workOrderSID: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSID: workOrderSID
    }
    return this.apiService.get("WorkOrder/GetWorkOrderBySID", params, options).toPromise();
  }

  getWorkOrder(siteNumber: string): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      siteNumber: siteNumber
    }
    return this.apiService.get("WorkOrder/GetWorkOrderSiteData", params, options).toPromise();
  }

  changeStatus(workOrderSID: number, status: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSID: workOrderSID,
      status: status
    }
    return this.apiService.get("WorkOrder/ChangeStatus", params, options).toPromise();
  }

  getDocuments(workOrderID: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      workOrderID: workOrderID,
      projectId: this.app.projectId
    }
    return this.apiService.get("WorkOrder/GetAttachments", params, options).toPromise();
  }

  GetWOCheckInHistory(workOrderID: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      workOrderID: workOrderID,
      projectId: this.app.projectId
    }
    return this.apiService.get("WorkOrder/GetWOCheckInHistory", params, options).toPromise();
  }

  GetWorkOrderCheckinUDFLovs(): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId
    }
    return this.apiService.get("WorkOrder/GetWorkOrderCheckinUDFLovs", params, options).toPromise();
  }

  GetLogsAndNotes(checkinSIDs: string): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderCheckInSidsString: checkinSIDs
    }
    return this.apiService.get("FieldServiceManagement/GetLogsAndNotes", params, options).toPromise();
  }

  GetFieldServiceManagementUDFLovs(workOrderSID: number, workOrderType: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSID: workOrderSID,
      moduleId: this.app.moduleId,
      workOrderType: workOrderType
    }
    return this.apiService.get("FieldServiceManagement/GetWorkOrderUDFs", params, options).toPromise();
  }

  GetVideoChecklistActions(workOrderSID: number, workOrderType: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSID: workOrderSID,
      workOrderType: workOrderType
    }
    return this.apiService.get("FieldServiceManagement/GetVideoChecklistActionsWithStatus", params, options).toPromise();
  }

  GetUploadedMediaForVQAJobChecklist(vqaJobChecklistSID: number, workOrderSID: number): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      workOrderSID: workOrderSID,
      vqaJobChecklistSID: vqaJobChecklistSID
    }
    return this.apiService.get("FieldServiceManagement/GetUploadedMediaForVQAJobChecklist", params, options).toPromise();
  }

  public getStorageDirectory(): string {
    let storageDirectory;
    if (this.app.platform.is('ios')) {
      storageDirectory = this.file.documentsDirectory;
    }
    else if(this.app.platform.is('android')) {
      //storageDirectory = this.file.externalRootDirectory + '/Download/';
      storageDirectory = this.file.externalDataDirectory;
    }
    return storageDirectory;
  }

  public downloadLog(attachment: string, fileName: string): Promise<any> {
    //FileTransfer plugin implementation
    let fileTransfer: FileTransferObject = this.transfer.create();
    let options = {
      withCredentials: true,
	  headers: {"Authorization": "Bearer " + localStorage.getItem("token")}
    };
    let storageDirectory = this.getStorageDirectory();
    let apiEndPoint = this.app.config.apiEndpoint;
    
    return fileTransfer.download(apiEndPoint + '/FieldServiceManagement/DownloadLog?attachment=' + encodeURIComponent(attachment) + '&projectId=' + this.app.projectId, storageDirectory + fileName, true, options);    
  }

  SaveSector(sector: string, workOrderSID: number, time: string, workOrderType: number) : Promise<any>{
    let headers = new Headers({ 'Content-Type': 'application/json',
    "X-Requested-With": "XMLHttpRequest"  });
    return this.apiService.post("/FieldServiceManagement/SaveSector?projectId="+ this.app.projectId +"&sector="+ sector +"&workOrderSID="+ workOrderSID +"&time="+ time +"&workOrderType="+ workOrderType, 
    null, 
    {
      headers: headers,
      withCredentials: true
    }).toPromise();
  }

  SaveWorkOrderCheckIn(workOrderCheckIn: WorkOrderCheckIn): Promise<any> {
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });
    return this.apiService.post("WorkOrder/SaveWorkOrderCheckIn?projectId=" + this.app.projectId, workOrderCheckIn, requestOptions).toPromise();
  }

  SaveWorkOrderCheckInUDFs(workOrderCheckInUDF: WorkOrderCheckInUDF): Promise<any> {
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });
    return this.apiService.post("WorkOrder/SaveWorkOrderCheckInUDFs?projectId=" + this.app.projectId, workOrderCheckInUDF, requestOptions).toPromise();
  }

  pickOFWorkOrderItem(pickListItem: any){
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });

    return this.apiService.post("WorkOrder/PickOFWorkOrderItem?projectId=" + this.app.projectId, pickListItem, requestOptions).toPromise();
  }

  packAndShipOFWorkOrderItems(workOderPackShipModel: any){
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });

    return this.apiService.post("WorkOrder/PackAndShipOFWorkOrderItems?projectId=" + this.app.projectId, workOderPackShipModel, requestOptions).toPromise();
  }


  saveWorkOrder(workOrder: WorkOrderModel): Promise<any> {
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });

    if (workOrder.WorkOrderSID == null) {
      return this.apiService.post("WorkOrder/CreateWorkOrder?projectId=" + this.app.projectId, workOrder, requestOptions).toPromise();
    } else {
      requestOptions.headers.append("Prefer", "return-content");
      return this.apiService.put("WorkOrder/SaveWorkOrder?projectId=" + this.app.projectId , workOrder, requestOptions).toPromise();
    }
  }

  saveWorkOrders(workOrders: WorkOrderModel[]): Promise<any> {
    //TODO clean this up
    let headers = new Headers({'Content-Type': 'application/json; charset=utf-8' });
    let requestOptions = new RequestOptions({
      headers: headers,
      withCredentials: true
    });

    requestOptions.headers.append("Prefer", "return-content");
    return this.apiService.put("WorkOrder/SaveWorkOrders?projectId=" + this.app.projectId , workOrders, requestOptions).toPromise();
  }
  
}
