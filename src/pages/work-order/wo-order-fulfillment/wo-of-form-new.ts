import { ViewChild, Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LoadingController } from 'ionic-angular';
import { BasePage } from '../../base.page';
import { AppService, WorkOrderService } from '../../../services/services';
import { WorkOrderModel, WorkOrderTypes } from '../../../models/models';
import * as moment from 'moment';
import { NavParams } from 'ionic-angular/navigation/nav-params';

@Component({
  selector: 'wo-of-form-new',
  templateUrl: 'wo-of-form-new.html',
  providers: [WorkOrderService]
})

export class WorkOrderOFFormNew extends BasePage {

  @ViewChild('newWorkOrderForm') newWorkOrderForm: NgForm;
  
  jobs: string[];
  salesOrders: any[];
  model: WorkOrderModel;
  minDockDate: String;
  maxDockDate: String;
  salesOrdersRefreshed: boolean;
  parentPage: any;
 
  constructor(loadingCtrl: LoadingController,
     private params: NavParams, 
     private app: AppService,
     private workOrderService: WorkOrderService
    ) {
    super(loadingCtrl);
    this.parentPage = params.get('parentPage');
    this.model = new WorkOrderModel();
    this.model.TypeSID = WorkOrderTypes.OrderFulfillment;
    this.model.ProjectId = this.app.projectId;
    this.minDockDate = moment().format('YYYY-MM-DD');
    this.maxDockDate = moment().add(1, 'years').format('YYYY-MM-DD');
  }

  ngOnInit(): void {
    this.getJobs();       
  }

  isSaveDisabled(){
    return !this.model.SiteNumber || !this.model.SalesOrders || !this.model.DockReadyDate || !this.model.PrioritySID;
  }

  onJobNumberChange(event) {
    this.salesOrdersRefreshed=false;
    this.getSOs();
  }

  getSOs(): void {
    this.presentLoading("Loading Sales Orders...");
    //this.workOrderService.getStaticOFWorkOrderDetails().then(
    this.workOrderService.getSalesOrders(this.model.SiteNumber).then(
     data => {
        this.dismissLoading();
        this.salesOrders = data.salesOrders;
        this.salesOrdersRefreshed=true;
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Sales Orders. Please try again.");
      }
    );
  }

  getJobs(): void {
    this.presentLoading("Loading Jobs...");
    this.workOrderService.getJobsAllowedForOFWorkOrderCreation().then( data => {
        this.dismissLoading();
        this.jobs = data;
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Jobs. Please try again.");
      }
    );
  }
 
  createWorkOrder(): void {
    this.presentLoading("Saving Work Order...");
    this.workOrderService.saveWorkOrder(this.model).then( 
      workOrder => {
        this.app.showToast("Work Order saved successfully!", "success");
        this.dismissLoading();
        this.parentPage.doRefresh(null);
        this.app.navCtrl.pop();
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while saving Work Order. Please try again.");
      }
    );
  }

}
