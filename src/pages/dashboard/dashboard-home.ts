import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DashboardService } from '../../services/services';
import { DashboardViewer } from './dashboard-viewer';
import { DashboardModel } from '../../models/models';

@Component({
  selector: 'dashboard-home',
  templateUrl: 'dashboard-home.html',
  providers: [DashboardService]
})
export class DashboardHome extends BasePage {

  dashboards: DashboardModel[];
  currentItem: DashboardModel;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private dashboardService: DashboardService, private app: AppService) {
    super(loadingCtrl);
    this.currentItem = navParams.get('item')
    if(this.currentItem){
      this.dashboards = this.currentItem.items;
    }
  }

  ngOnInit(): void {
    if (!this.dashboards){
      this.getDashboardData();
    }
  }

  getDashboardData(): void {
    this.app.presentLoading();
    this.dashboardService.getDashboardData()
    .then(
      data => {
        this.dashboards = data.Data as DashboardModel[];
        this.app.dismissLoading();
      },
      error => {
        console.error(error);
        this.app.dismissLoading();
        this.app.showErrorToast("An error has occurred fetching Work Orders");
      }
    );
  }

  itemSelected(event, item) {
    if (this.isGroup(item)) {
      this.app.navCtrl.push(DashboardHome, {
        item: item
      });
    } else {
      this.app.navCtrl.push(DashboardViewer, {
        item: item
      });
    }
  }

  isGroup(item) {
    if(item.items){
      return true;
    }
    return false;
  }

  getPageTitle(): string {
    if(this.currentItem){
      return "[" + this.currentItem.text + "]";
    }
    return "";
  }

  getGroupImage(item): string {    
    return "assets/images/dashboard/" + item.text.toLowerCase() + ".svg";
  }

  imageError(event) {
    event.target.onerror = "";
    event.target.src = "assets/images/dashboard/default.svg";
    return true;
  }

  getInitials(text): string {
    return text.replace(/[^A-Z]/g, "").substring(0, 3).toUpperCase();
  }
}