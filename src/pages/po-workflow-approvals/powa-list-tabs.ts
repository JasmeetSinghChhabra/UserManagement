import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { PowaType } from '../../models/models';
import { PowaHome } from './powa-home';
import { PowaForm } from './powa-form';

//@IonicPage()
@Component({
  selector: 'powa-list-tabs',
  templateUrl: 'powa-list-tabs.html'
})
export class PowaListTabs  {
  tab: number;
  poApporvals: any;
  poApporvalsParams: any;
  closeoutApporvals: any;
  closeoutApporvalsParams: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events) {
    let selectedTab = navParams.get("tab");
    if (selectedTab) {
      this.tab = selectedTab;
    } else {
      this.tab = 0;
    }

    this.poApporvals = PowaHome;
    this.poApporvalsParams = {
      type: PowaType.PO,
      allPrograms: false
    };
    this.closeoutApporvals = PowaHome;
    this.closeoutApporvalsParams = {
      type: PowaType.Closeout,
      allPrograms: false
    };
  }
}
