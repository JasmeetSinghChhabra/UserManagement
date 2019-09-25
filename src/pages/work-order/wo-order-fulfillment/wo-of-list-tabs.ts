import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { WorkOrderStatus, WorkOrderTypes } from '../../../models/models';
import { AuthService } from '../../../services/services';
import { UserTypes } from '../../../models/user/user.model';
import { WorkOrderOFList } from './wo-of-list';
import { OFWOViewTypes } from '../../../models/work-order/work-order.model';

//@IonicPage()
@Component({
  selector: 'wo-of-list-tabs',
  templateUrl: 'wo-of-list-tabs.html',
})
export class WorkOrderOFListTabs  {
  tab: number;
  
  pickUnassignedWorkOrders: any;
  pickAssignedWorkOrders: any;
  gcPickupUnassignedWorkOrders: any;
  gcPickupAssignedWorkOrders: any;
  qcWorkOrders: any;
  
  pickUnassignedWorkOrdersParams: any;
  pickAssignedWorkOrdersParams: any;
  gcPickupUnassignedWorkOrdersParams: any;
  gcPickupAssignedWorkOrdersParams: any;
  qcWorkOrdersParams: any;
  
  isOFAssociate: boolean;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, private auth: AuthService) {
    let selectedTab = navParams.get("tab");
    if (selectedTab) {
      this.tab = selectedTab;
    } else {
      this.tab = 0;
    }

    this.isOFAssociate = this.auth.userInfo.UserTypeId == UserTypes.OFAssociate;

    this.pickUnassignedWorkOrders = WorkOrderOFList;
    this.pickUnassignedWorkOrdersParams = {
      viewType: OFWOViewTypes.PickUnassigned
    };

    this.pickAssignedWorkOrders = WorkOrderOFList;
    this.pickAssignedWorkOrdersParams = {
      viewType: OFWOViewTypes.PickAssigned
    };
    
    this.gcPickupUnassignedWorkOrders = WorkOrderOFList;
    this.gcPickupUnassignedWorkOrdersParams = {
      viewType: OFWOViewTypes.GCPickupUnassigned
    };

    this.gcPickupAssignedWorkOrders = WorkOrderOFList;
    this.gcPickupAssignedWorkOrdersParams = {
      viewType: OFWOViewTypes.GCPickupAssigned
    };

    this.qcWorkOrders = WorkOrderOFList;
    this.qcWorkOrdersParams = {
      viewType: OFWOViewTypes.QC
    };
  }

  ngOnInit(): void {
  }

}
