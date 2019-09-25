import { Component, ViewChild } from '@angular/core';
import { NavParams, LoadingController, Content, Searchbar, AlertController } from 'ionic-angular';
import { BasePage } from '../../base.page';
import { AppService, WorkOrderService, AuthService } from '../../../services/services';
import { WorkOrderModel, WorkOrderStatus, UserTypes } from '../../../models/models';
import { AdditonalUserInformation } from '../../../services/common/auth.service';
import { MaterialPickList } from './material-pick-list';
import { ListDateTimeFormatPipe } from '../../../utils/utils';
import { Helper } from '../../../utils/utils';
import { WorkOrderOFAssign } from './wo-of-assign';
import { WorkOrderOFFormNew } from './wo-of-form-new';
import { OFWOViewTypes, WorkOrderStatusDesription } from '../../../models/work-order/work-order.model';
import * as moment from 'moment';

//@IonicPage()
@Component({
  selector: 'wo-of-list',
  templateUrl: 'wo-of-list.html',
  providers: [WorkOrderService]
})
export class WorkOrderOFList extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(Searchbar) searchbar: Searchbar;
  private tabBarHeight;
  private topOrBottom: string;
  private contentBox;
  selectedItem: any;
  WorkOrders: WorkOrderModel[];
  WorkOrdersOriginal: WorkOrderModel[];
  skip: number = 0;
  top: number = 10;
  toggled: boolean = false;
  searchTerm: string = '';
  currentUser: AdditonalUserInformation;
  assigneeUserSid: number = null;
  datePipe: ListDateTimeFormatPipe = null;
  fetchedAll: boolean;
  selectedWorkOrders: WorkOrderModel[] = [];
  assignEnabled: boolean;
  allowCreate: boolean;
  viewType: number;

  constructor(public loadingCtrl: LoadingController, private navParams: NavParams, private WorkOrderService: WorkOrderService,
    private helper: Helper, private app: AppService, private auth: AuthService, private alertCtrl: AlertController) {
    super(loadingCtrl);
    this.viewType = navParams.data.viewType;
    this.currentUser = this.auth.userInfo;
    this.assigneeUserSid = this.currentUser.UserSId;
    this.datePipe = new ListDateTimeFormatPipe(navigator.language || "en-US");
    this.assignEnabled = this.currentUser.UserTypeId == UserTypes.OFManager
      && (this.viewType == OFWOViewTypes.PickUnassigned || this.viewType == OFWOViewTypes.GCPickupUnassigned);
    this.allowCreate = this.auth.userInfo.UserTypeId != UserTypes.GC;
  }

  ngOnInit(): void {
    this.getWorkOrders();
  }

  getWorkOrders(): void {
    this.presentLoading();
    this.WorkOrderService.getOFWorkOrders(this.assigneeUserSid, this.viewType, this.top, this.skip).then(
      data => {
        this.WorkOrders = data as WorkOrderModel[];
        this.WorkOrdersOriginal = data as WorkOrderModel[];
        this.selectedWorkOrders = [];
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      }
    );
  }

  getStatusClass(workOrder: WorkOrderModel) {
    return 'status-' + this.helper.camelToDash(this.getStatus(workOrder.StatusSID));
  }

  getSelectedClass(item) {
    if (item.selected) {
      return 'row-selected';
    }
  }

  
  itemTapped(event, item) {
    if (this.selectedWorkOrders.length > 0) {
      this.itemPressed(event, item);
    }
    else if (this.viewType == OFWOViewTypes.PickUnassigned 
      || this.viewType == OFWOViewTypes.GCPickupUnassigned 
      || this.viewType == OFWOViewTypes.QC && !item.AssignedUserSID ) {
      this.validateAndGotoAssignToSelf(item, this.viewType);
    }
    else {
      this.showWorkOrderDetailPage(item, this.viewType);
    }
  }

  private validateAndGotoAssignToSelf(item: any, viewType: any) {
    if (this.viewType == OFWOViewTypes.PickUnassigned) {
      this.presentLoading();
      this.WorkOrderService.getOFWorkOrders(this.assigneeUserSid, OFWOViewTypes.PickAssigned, this.top, this.skip).then((data) => {
        if (data.length == 0) {
          this.showAssignToSelfAlert(item, viewType);
        }
        else {
          this.showAlreadyAssignedMessage();
        }
        this.dismissLoading();
      }, error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      });
    }
    else {
      this.showAssignToSelfAlert(item, viewType);
    }
  }

  private showAlreadyAssignedMessage() {
    let alert = this.alertCtrl.create({
      title: "Attention",
      message: "You currently have a Work Order assigned. You must complete that Work Order before assigning a new Work Order."
    });
    alert.addButton('Ok');
    alert.present();
  }

  itemPressed(event, item) {
    if (this.assignEnabled) {
      let index = this.selectedWorkOrders.indexOf(item);
      if (index > -1) {
        this.selectedWorkOrders.splice(index, 1);
        item.selected = false;
      }
      else if (this.selectedWorkOrders.length == 0 || this.selectedWorkOrders[0].MarketID == item.MarketID) {
        this.selectedWorkOrders.push(item);
        item.selected = true;
      }
      else {
        this.app.showAlert("Unable to Assign", "Multiple Work Orders can be assigned only for jobs under same market. Please reselect and try again!");
      }
    }
  }

  showAssignToSelfAlert(workOrder: WorkOrderModel, viewType: any) {
    let alert = this.alertCtrl.create({
      title: "Assign Work Order",
      message: "Do you want to assign this Work Order to yourself?",
      buttons: [
        {
          text: 'Yes',
          handler: data => {
            this.assignWorkOrderToSelfAndGoToPickPage(workOrder, viewType);
          }
        },
        {
          text: "No",
          role: 'cancel',
          handler: data => {
            console.log('No clicked');
          }
        }
      ]
    });
    alert.present();
  }

  assignWorkOrderToSelfAndGoToPickPage(workOrder: WorkOrderModel, viewType: any) {
    workOrder.StatusSID = this.assignWorkOrderStatus(viewType);
    workOrder.AssignedUserSID = this.currentUser.UserSId;
    this.presentLoading("Assigning Work Order...");
    this.WorkOrderService.saveWorkOrder(workOrder).then(
      () => {
        workOrder.AssignedUserName = this.currentUser.UserName;
        this.app.showToast("Work Order assigned successfully!", "success");
        this.dismissLoading();
        const index = this.WorkOrders.indexOf(workOrder, 0);
        if (index > -1) {
          this.WorkOrders.splice(index, 1);
        }
        this.showWorkOrderDetailPage(workOrder,
          this.viewType == OFWOViewTypes.GCPickupUnassigned ? OFWOViewTypes.GCPickupAssigned :
            this.viewType == OFWOViewTypes.PickUnassigned ? OFWOViewTypes.PickAssigned : this.viewType);
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while assigning Work Order. Please try again.");
      }
    );
  }

  assignWorkOrderStatus(viewType: any): number {
    if(viewType == OFWOViewTypes.PickUnassigned) {
      return WorkOrderStatus.KitInProgress;
    }
    if(viewType == OFWOViewTypes.QC){  
      return WorkOrderStatus.QCInProgress;
    }
    if(viewType == OFWOViewTypes.GCPickupUnassigned){
      return WorkOrderStatus.GCReview;
    }
  }

  showWorkOrderAssignPage() {
    this.app.navCtrl.push(WorkOrderOFAssign, {
      selectedWorkOrders: this.selectedWorkOrders,
      parentPage: this
    });
  }

  showWorkOrderDetailPage(item, viewType) {
    this.app.navCtrl.push(MaterialPickList, {
      item: item,
      parentPage: this,
      viewType: viewType
    });
  }

  showNewWorkOrderPage() {
    this.app.navCtrl.push(WorkOrderOFFormNew, {
      parentPage: this
    });
  }

  toggleSearch() {
    this.toggled = !this.toggled;
    setTimeout(() => {
      if (this.searchbar) this.searchbar.setFocus();
    });
  }

  getStatusDescription(statusSID): string {
    return WorkOrderStatusDesription[this.getStatus(statusSID)];
  }

  getStatus(statusSID): string {
    return WorkOrderStatus[statusSID];
  }

  formatDate(date: string) {
    return moment(date).format("MM/DD/YYYY, LT");
  }

  search(event) {
    // set val to the value of the searchbar
    let val = event.target.value;
    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      console.log(val.toLowerCase());
      if (!this.fetchedAll) {
        this.WorkOrderService.getOFWorkOrders(this.assigneeUserSid, this.viewType, 0, this.skip).then(
          data => {
            this.WorkOrdersOriginal = data as WorkOrderModel[];
            this.dismissLoading();
            this.WorkOrders = this.WorkOrdersOriginal.filter(item => this.doFilter(item, val));
            this.fetchedAll = true;
            this.skip = this.WorkOrders.length;
          },
          error => {
            console.error(error);
            this.dismissLoading();
            this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
          }
        );
      }
      else {
        this.WorkOrders = this.WorkOrdersOriginal.filter(item => this.doFilter(item, val));
      }
    } else {
      this.WorkOrders = this.WorkOrdersOriginal.slice();
    }
  }

  doFilter(item, val) {
    return item.SiteName.toLowerCase().indexOf(val.toLowerCase()) > -1
      || item.SiteNumber.toLowerCase().indexOf(val.toLowerCase()) > -1
      || (item.PriorityDescription == null ? "" : item.PriorityDescription).toLowerCase().indexOf(val.toLowerCase()) > -1
      || (item.DockReadyDate == null ? "" : item.DockReadyDate).toLowerCase().indexOf(val.toLowerCase()) > -1
      || item.WorkOrderSID.toString().indexOf(val) > -1
      || (item.DockReadyDate == null ? "" : this.datePipe.transform(item.DockReadyDate).toLowerCase()).indexOf(val.toLowerCase()) > -1;
  };

  doRefresh(refresher) {
    this.skip = 0;
    console.log(`Refresher scrolling... Top:${this.top} Skip:${this.skip}`);
    this.WorkOrderService.getOFWorkOrders(this.assigneeUserSid, this.viewType, this.top, this.skip).then(
      data => {
        this.WorkOrders = data as WorkOrderModel[];
        this.WorkOrdersOriginal = data as WorkOrderModel[];
        this.selectedWorkOrders = [];
        if (refresher) {
          refresher.complete();
        }
      },
      error => {
        console.error(error);
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      }
    );
  }

  doPulling(refresher) {
    //console.log('Do Pulling...', refresher.progress);
  }

  doInfinite(infiniteScroll) {
    this.skip += 10;
    console.log(`Infinite scrolling... Top:${this.top} Skip:${this.skip}`);
    this.WorkOrderService.getOFWorkOrders(this.assigneeUserSid, this.viewType, this.top, this.skip).then(
      data => {
        let newWorkOrders = data as WorkOrderModel[];
        this.WorkOrders = this.WorkOrders.slice();
        this.WorkOrdersOriginal = this.WorkOrdersOriginal.slice();

        for (let i = 0; i < newWorkOrders.length; i++) {
          this.WorkOrders.push(newWorkOrders[i]);
          this.WorkOrdersOriginal.push(newWorkOrders[i]);
        }
        infiniteScroll.complete();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      }
    );
  }

}