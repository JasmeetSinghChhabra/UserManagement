import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, ToastController, Events, Nav, ModalController, MenuController } from 'ionic-angular';
import { AuthService, AppService } from '../../services/services';
import { WorkOrderCONListTabs } from '../work-order/wo-construction/wo-con-list-tabs';
import { ProgramSelector } from '../../components/program-selector/program-selector';
import { BasePage } from '../base.page';
import { WorkOrderTypes, SubModule } from '../../models/models';
import { WorkOrderOFListTabs } from './wo-order-fulfillment/wo-of-list-tabs';
import { WorkOrderType } from '../../models/work-order/work-order.model';
import { UserTypes } from '../../models/user/user.model';

@Component({
  selector: 'work-order-home',
  templateUrl: 'work-order-home.html'
})
export class WorkOrderHome extends BasePage {

  @ViewChild(Nav) nav: Nav;
  WorkOrderTypes: WorkOrderType[] = [];

  constructor(loadingCtrl: LoadingController, private http: Http,
    private toastCtrl: ToastController, public auth: AuthService, private events: Events,
    private app: AppService, private modalCtrl: ModalController, private menuCtrl: MenuController) {
    super(loadingCtrl);
    this.menuCtrl.enable(true);
  }

  ngOnInit(): void {
    this.getWorkOrderTypes();
  }

  getWorkOrderTypes(): void {
    if(this.app.hasSubModulePermission(SubModule.TowerService)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Tower Service';
      wot.TypeIcon = 'build';
      wot.TypeSID = WorkOrderTypes.TowerService;
      wot.Page=WorkOrderCONListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if(this.app.hasSubModulePermission(SubModule.OrderFulfillment)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Order Fulfillment';
      wot.TypeIcon = 'clipboard';
      wot.TypeSID = WorkOrderTypes.OrderFulfillment;
      wot.Page=WorkOrderOFListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if(this.app.hasSubModulePermission(SubModule.GroundServiceCivil)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Ground Service - Civil';
      wot.TypeIcon = 'build';
      wot.TypeSID = WorkOrderTypes.GroundServiceCivil;
      wot.Page=WorkOrderCONListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if(this.app.hasSubModulePermission(SubModule.GroundServicePowerPlant)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Ground Service - Power Plant';
      wot.TypeIcon = 'build';
      wot.TypeSID = WorkOrderTypes.GroundServicePowerPlant;
      wot.Page=WorkOrderCONListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if(this.app.hasSubModulePermission(SubModule.GroundServiceSmallCell)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Ground Service - Small Cell';
      wot.TypeIcon = 'build';
      wot.TypeSID = WorkOrderTypes.GroundServiceSmallCell;
      wot.Page=WorkOrderCONListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if(this.app.hasSubModulePermission(SubModule.GroundServiceIntegration)){
      let wot = new WorkOrderType();
      wot.TypeDescription = 'Ground Service - Integration';
      wot.TypeIcon = 'build';
      wot.TypeSID = WorkOrderTypes.GroundServiceIntegration;
      wot.Page=WorkOrderCONListTabs;
      this.WorkOrderTypes.push(wot);
    }

    if (this.WorkOrderTypes.length ==1){
      this.app.navCtrl.setRoot(this.WorkOrderTypes[0].Page, {woType: this.WorkOrderTypes[0].TypeSID});
    }
  }

  switchProgram() {
    let modal = this.modalCtrl.create(ProgramSelector);
    modal.present();
  }

  onRefreshKpis(url: string) {
    this.presentLoading();

    setTimeout(() => {
      this.dismissLoading();
    }, 3000);
  }

  itemTapped(workOrderType: WorkOrderType) {
    this.app.navCtrl.setRoot(workOrderType.Page, {woType: workOrderType.TypeSID});
  }

}
