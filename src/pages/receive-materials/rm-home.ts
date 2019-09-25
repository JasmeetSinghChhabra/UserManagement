import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, ToastController, Events, Nav, ModalController, MenuController } from 'ionic-angular';
import { AuthService, AppService } from '../../services/services';
import { ProgramSelector } from '../../components/program-selector/program-selector';
import { BasePage } from '../base.page';
import { Modules, SubModule } from '../../models/common/common.model';
import { RMSiteSearch } from '../receive-materials/rm-search';
import { RMSiteSearchMaterial } from '../receive-materials/rm-materialsearch';
import { RMSubModule } from '../../models/models';

@Component({
  selector: 'rm-home',
  templateUrl: 'rm-home.html'
})
export class RMHome extends BasePage {

  @ViewChild(Nav) nav: Nav;

  subModuleRM3PL: number;
  subModuleRMNexius: number;
  ReceiveMaterialsSubModules: RMSubModule[];

  constructor(loadingCtrl: LoadingController, private http: Http,
    private toastCtrl: ToastController, public auth: AuthService, private events: Events,
    private app: AppService, private modalCtrl: ModalController, private menuCtrl: MenuController) {
    super(loadingCtrl);
    this.menuCtrl.enable(true);
    this.subModuleRM3PL = SubModule.ReceiveMaterials3PL;
    this.subModuleRMNexius = SubModule.ReceiveMaterialsNexius;
  }

  ngOnInit(): void {
    this.getRMSubModules();
  }

  receiveMaterials(receiverID: number): void {
    this.app.moduleId = Modules.ReceiveMaterials;
    if(receiverID == 7){this.app.navCtrl.setRoot(RMSiteSearchMaterial);}
    else this.app.navCtrl.setRoot(RMSiteSearch);
  }

  switchProgram() {
    let modal = this.modalCtrl.create(ProgramSelector);
    modal.present();
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

}
