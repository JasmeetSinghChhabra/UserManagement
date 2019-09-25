import { Component } from '@angular/core';
import { NavParams, LoadingController } from 'ionic-angular';
import { BasePage } from '../../base.page';
import { UserService } from "../../../services/services";
import { WorkOrderModel, UserTypes, Modules, WorkOrderStatus } from '../../../models/models';
import { User } from '../../../models/user/user.model';
import { AuthService } from '../../../services/common/auth.service';
import { AppService } from '../../../services/common/app.service';
import { WorkOrderService } from '../../../services/work-order/work-order.service';


@Component({
  selector: 'wo-of-assign',
  templateUrl: 'wo-of-assign.html',
  providers: [UserService, WorkOrderService]
})

export class WorkOrderOFAssign extends BasePage {
  selectedWorkOrders: WorkOrderModel[];
  assigneeUsers: User[];
  currentUser: User;
  assignedUserSID: number;
  parentPage: any;
  workOrderHeader: string;
 
  constructor(params: NavParams, loadingCtrl: LoadingController, private auth: AuthService,
    private userService: UserService, private workOrderService: WorkOrderService, private app: AppService) {
    super(loadingCtrl);
    this.selectedWorkOrders = params.get('selectedWorkOrders');
    this.workOrderHeader = this.selectedWorkOrders.length > 1 ? "Work Orders" : "Work Order";
    this.parentPage = params.get('parentPage');
    let currentUser = new User();
    currentUser.UserId = auth.userInfo.UserId;
    currentUser.UserType= auth.userInfo.UserTypeDescription;
    currentUser.UserSid= auth.userInfo.UserSId;
    currentUser.UserName = auth.userInfo.UserName;
    currentUser.UserTypeId = auth.userInfo.UserTypeId;
    this.currentUser = currentUser;
  }

  ngOnInit(): void {
    this.getUsers();
    let assignedUserSids: Set<number> = new Set();
    this.selectedWorkOrders.forEach( workOrder => 
      {
        assignedUserSids.add(workOrder.AssignedUserSID);
      }
    );
    if(assignedUserSids.size==1){
      this.assignedUserSID=assignedUserSids.values().next().value;
    }
  }
  
  getUsers(): void {
    this.presentLoading("Loading Assignee list...");
    this.userService.getUsersbyTypeAndPermissions(UserTypes.OFAssociate, Modules.WorkOrder).subscribe(
      response => {
        this.dismissLoading();
        this.assigneeUsers = response;
        this.assigneeUsers.push(this.currentUser);
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Assignee list. Please try again.");
      }
    );
  }

  cancel(){
    this.app.navCtrl.pop();
  }

  assignWorkOrders(){
    this.selectedWorkOrders.forEach(workOrder => {
      workOrder.StatusSID=WorkOrderStatus.KitInProgress;
      workOrder.AssignedUserSID=this.assignedUserSID;
    })
    this.saveWorkOrders()
  }

  saveWorkOrders(): void {
    this.presentLoading(`Assigning ${this.workOrderHeader}...`);
    this.workOrderService.saveWorkOrders(this.selectedWorkOrders).then(
      workOrder => {
        this.app.showToast(`${this.workOrderHeader} assigned successfully!`, "success");
        this.dismissLoading();
        this.parentPage.doRefresh(null);
        this.app.navCtrl.pop();
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast(`An error occurred while assigning ${this.workOrderHeader}. Please try again.`);
      }
    );
  }
}