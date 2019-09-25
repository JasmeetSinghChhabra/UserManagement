import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, ToastController, Events, Nav, ModalController, MenuController } from 'ionic-angular';
import { AuthService, AppService, Settings } from '../../services/services';
import { DfrListTabs } from '../daily-field-report/dfr-list-tabs';
import { DviListTabs } from '../daily-vehicle-inspection/dvi-list-tabs';
import { PowaListTabs } from '../po-workflow-approvals/powa-list-tabs';
import { PowaHome } from '../po-workflow-approvals/powa-home';
import { ProgramSelector } from '../../components/program-selector/program-selector';
import { BasePage } from '../base.page';
import { Modules, SubModule } from '../../models/common/common.model';
import { WorkOrderType, WorkOrderTypes } from '../../models/work-order/work-order.model';
import { WorkOrderCONListTabs } from '../work-order/wo-construction/wo-con-list-tabs';
import { WorkOrderOFListTabs } from '../work-order/wo-order-fulfillment/wo-of-list-tabs';
import { RMHome } from '../receive-materials/rm-home';
import { RMSiteSearch } from '../receive-materials/rm-search';
import { RMSiteSearchMaterial } from '../receive-materials/rm-materialsearch';
import { RMSubModule } from '../../models/receive-materials/receive-materials.model';
import { Storage } from '@ionic/storage';
import { WCIStart } from '../warehouse-check-in/wci-start';
import { ReceiveMaterialsModule } from '../receive-materials/receive-materials.module';

@Component({
  selector: 'home',
  templateUrl: 'home.html'
})
export class Home extends BasePage {

  @ViewChild(Nav) nav: Nav;

  moduleApprovals: number;
  subModulePO: number;
  subModuleCloseout: number;
  subModuleRM3PL: number;
  subModuleRMNexius: number;
  WorkOrderSubModules: WorkOrderType[];
  ReceiveMaterialsSubModules: RMSubModule[];

  constructor(loadingCtrl: LoadingController, private http: Http,
    private toastCtrl: ToastController, public auth: AuthService, private events: Events,
    private app: AppService, private modalCtrl: ModalController, private menuCtrl: MenuController,
    private storage: Storage,
    private settings: Settings) {
    super(loadingCtrl);
    this.menuCtrl.enable(true);

    this.subModulePO = SubModule.POs;
    this.subModuleCloseout = SubModule.Closeouts;
    this.subModuleRM3PL = SubModule.ReceiveMaterials3PL;
    this.subModuleRMNexius = SubModule.ReceiveMaterialsNexius;
  }

  ngOnInit(): void {

    let WOOF_GCPickupFormKeyPrefix = "GCPickupForm_";
    this.storage.ready().then(() => {
      this.storage.forEach((value, key, index) => {
        console.log("Ionic Storage found. Key = " + key + "|Value = " + value + "|Index = " + index);
        if (key.indexOf(WOOF_GCPickupFormKeyPrefix) != -1) {
          this.storage.remove(key);
          console.log("Removed " + key);
        }
      });
    });
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

  dfrTapped(tab: number) {
    this.app.moduleId = Modules.DailyFieldReport;
    this.app.navCtrl.setRoot(DfrListTabs, { tab: tab });
  }

  dviTapped(tab: number) {
    this.app.moduleId = Modules.DailyFieldReport;
    this.app.navCtrl.setRoot(DviListTabs, { tab: tab });
  }

  workOrderTapped(workOrderType: WorkOrderType) {
    this.app.moduleId = Modules.WorkOrder;
    this.app.navCtrl.setRoot(workOrderType.Page, {woType: workOrderType.TypeSID});
  }

  pendingApprovals(tab: number) {
    this.app.moduleId = Modules.POWorkflowApprovals;
    this.app.navCtrl.setRoot(PowaHome, {
      type: this.getType(tab)
    });
  }

  getType(tab): string {
    if (tab == 0) {
      return "PO";
    } else {
      return "CLOSEOUT";
    }
  }

  getWorkOrderTypes(): WorkOrderType[] {
    if (!this.WorkOrderSubModules || this.WorkOrderSubModules.length == 0) {
      this.WorkOrderSubModules = [];

      if (this.app.hasSubModulePermission(SubModule.TowerService)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Tower Service';
        wot.TypeSID = WorkOrderTypes.TowerService;
        wot.Page = WorkOrderCONListTabs;
        this.WorkOrderSubModules.push(wot);
      }

      if (this.app.hasSubModulePermission(SubModule.OrderFulfillment)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Order Fulfillment';
        wot.TypeSID = WorkOrderTypes.OrderFulfillment;
        wot.Page = WorkOrderOFListTabs;
        this.WorkOrderSubModules.push(wot);
      }

      if (this.app.hasSubModulePermission(SubModule.GroundServiceCivil)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Ground Service - Civil';
        wot.TypeSID = WorkOrderTypes.GroundServiceCivil;
        wot.Page = WorkOrderCONListTabs;
        this.WorkOrderSubModules.push(wot);
      }

      if (this.app.hasSubModulePermission(SubModule.GroundServicePowerPlant)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Ground Service - Power Plant';
        wot.TypeSID = WorkOrderTypes.GroundServicePowerPlant;
        wot.Page = WorkOrderCONListTabs;
        this.WorkOrderSubModules.push(wot);
      }

      if (this.app.hasSubModulePermission(SubModule.GroundServiceSmallCell)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Ground Service - Small Cell';
        wot.TypeSID = WorkOrderTypes.GroundServiceSmallCell;
        wot.Page = WorkOrderCONListTabs;
        this.WorkOrderSubModules.push(wot);
      }

      if (this.app.hasSubModulePermission(SubModule.GroundServiceIntegration)) {
        let wot = new WorkOrderType();
        wot.TypeDescription = 'Ground Service - Integration';
        wot.TypeSID = WorkOrderTypes.GroundServiceIntegration;
        wot.Page = WorkOrderCONListTabs;
        this.WorkOrderSubModules.push(wot);
      }
    }
    return this.WorkOrderSubModules;
  }

  getRMSubModules(): RMSubModule[] {
    if (!this.ReceiveMaterialsSubModules || this.ReceiveMaterialsSubModules.length == 0) {
      this.ReceiveMaterialsSubModules = [];

      if (this.app.hasSubModulePermission(SubModule.ReceiveMaterials3PL)) {
        let sm = new RMSubModule();
        sm.ModuleID = Modules.ReceiveMaterials;
        sm.SMDescription = "Customer Provided";
        sm.SMSID = 6;
        this.ReceiveMaterialsSubModules.push(sm);
      }
      if (this.app.hasSubModulePermission(SubModule.ReceiveMaterialsNexius)) {
        let sm = new RMSubModule();
        sm.ModuleID = Modules.ReceiveMaterials;
        sm.SMDescription = "Nexius";
        sm.SMSID = 7;
        this.ReceiveMaterialsSubModules.push(sm);
      }
    }
    return this.ReceiveMaterialsSubModules;
  }

  isHomeEmpty(): boolean {
    if ((this.app.checkModulePermission(15) && this.app.checkModulePermission(4))
      || this.app.hasSubModulePermission(SubModule.Closeouts) || this.app.hasSubModulePermission(SubModule.POs)
      || this.app.hasSubModulePermission(SubModule.OrderFulfillment) || this.app.hasSubModulePermission(SubModule.TowerService)
      || this.app.hasSubModulePermission(SubModule.GroundServiceCivil) || this.app.hasSubModulePermission(SubModule.GroundServicePowerPlant)
      || this.app.checkModulePermission(37)) {
      return false;
    }
    return true;
  }

  warehouseCheckIn(): void {
    console.log("warehouse checkin from home card");
    this.app.moduleId = Modules.WarehouseCheckIn;
    this.app.navCtrl.push(WCIStart);
  }
  
  receiveMaterials(receiverID: number): void {
    this.app.moduleId = Modules.ReceiveMaterials;
    if(receiverID == 7){this.app.navCtrl.setRoot(RMSiteSearchMaterial);}
    else this.app.navCtrl.setRoot(RMSiteSearch);
  }

} 
