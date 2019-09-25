import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DfrStatus } from '../../models/models';
import { DfrList } from './dfr-list';
import { DfrForm } from './dfr-form';

//@IonicPage()
@Component({
  selector: 'dfr-list-tabs',
  templateUrl: 'dfr-list-tabs.html'
})
export class DfrListTabs  {
  tab: number;
  newDfrs: any;
  newDfrsParams: any;
  savedDfrs: any;
  savedDfrsParams: any;
  paDfrs: any;
  paDfrsParams: any;
  approvedDfrs: any;
  approvedDfrsParams: any;
  rejectedDfrs: any;
  rejectedDfrsParams: any;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    let selectedTab = navParams.get("tab");
    if (selectedTab) {
      this.tab = selectedTab;
    } else {
      this.tab = 0;
    }

    this.newDfrs = DfrList;
    this.newDfrsParams = {
      status: DfrStatus.New
    };
    this.savedDfrs = DfrList;
    this.savedDfrsParams = {
      status: DfrStatus.Saved
    };
    this.paDfrs = DfrList;
    this.paDfrsParams = {
      status: DfrStatus.Submitted
    };
    this.approvedDfrs = DfrList;
    this.approvedDfrsParams = {
      status: DfrStatus.Approved
    };
    this.rejectedDfrs = DfrList;
    this.rejectedDfrsParams = {
      status: DfrStatus.Rejected
    };
  }

  newDfr() {
    this.navCtrl.push(DfrForm);
  }
}
