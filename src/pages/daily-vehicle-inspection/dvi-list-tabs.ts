import { Component } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';
import { DviStatus } from '../../models/models';
import { AppService } from '../../services/services';
import { DviList } from './dvi-list';
import { DviForm } from './dvi-form';

//@IonicPage()
@Component({
  selector: 'dvi-list-tabs',
  templateUrl: 'dvi-list-tabs.html'
})
export class DviListTabs  {
  tab: number;
  newDvis: any;
  newDvisParams: any;
  savedDvis: any;
  savedDvisParams: any;
  subDvis: any;
  subDvisParams: any;

  constructor(public navParams: NavParams, private app: AppService) {
    let selectedTab = navParams.get("tab");
    if (selectedTab) {
      this.tab = selectedTab;
    } else {
      this.tab = 0;
    }

    this.newDvis = DviList;
    this.newDvisParams = {
      status: DviStatus.New
    };
    this.savedDvis = DviList;
    this.savedDvisParams = {
      status: DviStatus.Saved
    };
    this.subDvis = DviList;
    this.subDvisParams = {
      status: DviStatus.Submitted
    };
  }

  newDvi() {
    this.app.navCtrl.push(DviForm);
  }
}
