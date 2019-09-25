import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar } from 'ionic-angular';
import { BasePage } from '../../base.page';
import { AppService, WorkOrderService } from '../../../services/services';
import { WorkOrderModel } from '../../../models/models';
import { WorkOrderCONForm } from './wo-con-form';
import { AuthService } from '../../../services/common/auth.service';
import { ListDateTimeFormatPipe } from '../../../utils/utils';
import { Helper } from '../../../utils/app.helper';

//@IonicPage()
@Component({
  selector: 'wo-con-list',
  templateUrl: 'wo-con-list.html',
  providers: [WorkOrderService]
})

export class WorkOrderCONList extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(Searchbar) searchbar: Searchbar;
  private tabBarHeight;
  private topOrBottom: string;
  private contentBox;
  selectedItem: any;
  WorkOrders: WorkOrderModel[];
  WorkOrdersOriginal: WorkOrderModel[];
  status: number = 2;
  skip: number = 0;
  top: number = 10;
  toggled: boolean = false;
  searchTerm: string = '';
  datePipe:ListDateTimeFormatPipe = null;
  fetchedAll: boolean;
  woType: number;

  constructor(public loadingCtrl: LoadingController, private navParams: NavParams, private WorkOrderService: WorkOrderService,
    private helper:Helper,  private app: AppService, private auth: AuthService) {
    super(loadingCtrl);
    this.status = navParams.data.status;
    this.woType = navParams.data.woType;
    this.datePipe = new ListDateTimeFormatPipe(navigator.language || "en-US");
  }

  ngOnInit(): void {
    this.getWorkOrders();
  }

  getWorkOrders(): void {
    this.presentLoading();
  
    this.WorkOrderService.getWorkOrdersByTypeAndStatus(this.woType, this.status, this.top, this.skip, this.auth.userInfo.IsUserGC).then(
      data => {
        this.WorkOrders = data as WorkOrderModel[];
        this.WorkOrdersOriginal = data as WorkOrderModel[];
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      }
    );
  }

  itemTapped(event, item) {
    //Navigate to the WorkOrder form page
    this.app.navCtrl.push(WorkOrderCONForm, {
      item: item,
        "parentPage": this 
    });
  }

  getPriorityClass(item: WorkOrderModel) {
    if(item.PriorityDescription) {
        return 'status-' + this.helper.camelToDash(item.PriorityDescription);
      } else {
        return 'status-no-priority';
      }
  }

  toggleSearch() {
    this.toggled = !this.toggled;
    setTimeout(() => {
      if (this.searchbar) this.searchbar.setFocus();
    });
  }

  search(event) {
    // set val to the value of the searchbar
    let val = event.target.value;
    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      console.log(val.toLowerCase());
      if(!this.fetchedAll){
        this.WorkOrderService.getWorkOrdersByTypeAndStatus(this.woType, this.status, 0, this.skip, this.auth.userInfo.IsUserGC).then(
          data => {
            this.WorkOrdersOriginal = data as WorkOrderModel[];
            this.WorkOrders = this.WorkOrdersOriginal.filter(item => this.doFilter(item, val));
            this.dismissLoading();
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
      else{
        this.WorkOrders = this.WorkOrdersOriginal.filter(item => this.doFilter(item, val));
      }
    } else {
      this.WorkOrders = this.WorkOrdersOriginal.slice();
    }
  }

  doFilter(item, val){
    return item.SiteName.toLowerCase().indexOf(val.toLowerCase()) > -1
    || item.SiteNumber.toLowerCase().indexOf(val.toLowerCase()) > -1
    || (item.PriorityDescription==null?"":item.PriorityDescription).toLowerCase().indexOf(val.toLowerCase()) > -1
    || (item.ScheduledStartDate==null?"":item.ScheduledStartDate).toLowerCase().indexOf(val.toLowerCase()) > -1
    || item.WorkOrderSID.toString().indexOf(val) > -1
    || (item.ScheduledStartDate==null ? "" : this.datePipe.transform(item.ScheduledStartDate).toLowerCase()).indexOf(val.toLowerCase()) > -1;
  };


  doRefresh(refresher) {
    this.skip = 0;
    console.log(`Refresher scrolling... Top:${this.top} Skip:${this.skip}`);
    this.WorkOrderService.getWorkOrdersByTypeAndStatus(this.woType, this.status, this.top, this.skip, this.auth.userInfo.IsUserGC).then(
      data => {
        this.WorkOrders = data as WorkOrderModel[];
        this.WorkOrdersOriginal = data as WorkOrderModel[];

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
    this.WorkOrderService.getWorkOrdersByTypeAndStatus(this.woType, this.status, this.top, this.skip, this.auth.userInfo.IsUserGC).then(
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
