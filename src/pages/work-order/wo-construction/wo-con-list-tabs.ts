import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { WorkOrderStatus, User } from '../../../models/models';
import { WorkOrderCONList } from './wo-con-list';

//@IonicPage()
@Component({
  selector: 'wo-con-list-tabs',
  templateUrl: 'wo-con-list-tabs.html',
})
export class WorkOrderCONListTabs  {
  tab: number;
  
  issuedWorkOrders: any;
  inProgressWorkOrders: any;
  completedWorkOrders: any;
  
  issuedWorkOrdersParams: any;
  inProgressWorkOrdersParams: any;
  completedWorkOrdersParams: any;
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    
    let selectedTab = navParams.get("tab");
    let woType = navParams.get("woType");

    if (selectedTab) {
      this.tab = selectedTab;
    } else {
      this.tab = 0;
    }

    this.issuedWorkOrders = WorkOrderCONList;
    this.issuedWorkOrdersParams = {
      status: WorkOrderStatus.Issued,
      woType: woType
    };
    
    this.inProgressWorkOrders = WorkOrderCONList;
    this.inProgressWorkOrdersParams = {
      status: WorkOrderStatus.InProgress,
      woType: woType
    };
    this.completedWorkOrders = WorkOrderCONList;
    this.completedWorkOrdersParams = {
      status: WorkOrderStatus.Completed,
      woType: woType
    };
  }

  ngOnInit(): void {
  }

}
