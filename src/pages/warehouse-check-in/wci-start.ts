import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar} from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, WarehouseCheckInService } from '../../services/services';
import { Home } from '../home/home';
import { WCISiteSearch } from './wci-site-search';
import { MenuController } from 'ionic-angular/components/app/menu-controller';

//import { AppService, SafetyAuditService, GeoService } from '../../services/services';


declare var google;

//@IonicPage()
@Component({
  selector: 'wci-start',
  templateUrl: 'wci-start.html',
  providers: [WarehouseCheckInService]
})

export class WCIStart extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(Searchbar) searchbar: Searchbar;

  private tabBarHeight;
  private topOrBottom: string;
  private contentBox;
  redirect: any;

  constructor(
    loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private navParams: NavParams,
    private warehouseCheckInService: WarehouseCheckInService,
    private app: AppService) {
    super(loadingCtrl); 
  }

  ngOnInit(): void {    
    this.menuCtrl.swipeEnable(false);
    this.redirect = setTimeout(() => {
      this.app.navCtrl.push(WCIStart);
    }, 600000)
  }

  ionViewWillLeave(){
    this.resetTimeout();
  }

  resetTimeout(){
    clearTimeout(this.redirect);
  }

  ngAfterViewInit(): void {
  }

  search(event) {
    // set val to the value of the searchbar
    let val = event.target.value;
    // if the value is an empty string don't filter the items
  }

  goHome() {
//    this.app.navCtrl.pop();
    this.app.navCtrl.push(Home);
  }

  doCheckIn() {
    this.app.navCtrl.push(WCISiteSearch);
  }
}
