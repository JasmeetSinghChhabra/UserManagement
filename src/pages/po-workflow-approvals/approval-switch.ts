import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { PowaType, SubModule } from '../../models/models';
import { PowaHome } from './powa-home';
import { PowaForm } from './powa-form';
import { AppService } from '../../services/services';
import { PowaListTabs } from './powa-list-tabs';

//@IonicPage()
@Component({
  selector: 'approval-switch',
  templateUrl: 'approval-switch.html'
})
export class ApprovalSwitch  {

  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events, private app: AppService) {
    if (!(this.app.hasSubModulePermission(SubModule.POs) && this.app.hasSubModulePermission(SubModule.Closeouts))){
      this.navCtrl.setRoot(PowaHome);
    } else {
      this.navCtrl.setRoot(PowaListTabs);
    }
  }
}
