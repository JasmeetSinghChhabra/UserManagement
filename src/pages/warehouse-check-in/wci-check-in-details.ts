import { Component, ViewChild } from '@angular/core';
import { NavController, Alert } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, AuthService, WarehouseCheckInService, SignatureService } from '../../services/services';
import { WarehouseCheckInModel, WCISite, WCICheckIn } from '../../models/models';
import { Helper } from '../../utils/utils';
import * as moment from 'moment';
import { WCIStart } from './wci-start';
import { WCIThankYou } from './wci-thank-you';

@Component({
  selector: 'wci-check-in-details',
  templateUrl: 'wci-check-in-details.html',
  providers: [WarehouseCheckInService]
})
export class WCICheckInDetails extends BasePage {

  model: WCISite;
  checkIn: WCICheckIn;
  page: string;
  pageRedirect: any;
  alert: Alert;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams,
    private warehouseCheckInService: WarehouseCheckInService, private app: AppService, private auth: AuthService,
    private alertCtrl: AlertController, private modalCtrl: ModalController, private helper: Helper,
    public navCtrl: NavController) {
    super(loadingCtrl);
    this.page = "wci-check-in-details";
    this.model = navParams.get('item');
  }

  ngOnInit(): void {
    this.checkIn = new WCICheckIn;
    this.checkIn.CheckInName = "";
    this.checkIn.CheckInPhone = "";
    this.checkIn.CheckInEmail = "";
    this.checkIn.WOSID = this.model.WOSID;

    this.pageRedirect = setTimeout(() => {
      this.app.navCtrl.push(WCIStart);
    }, 240000)
  }

  ionViewWillLeave(){
    clearTimeout(this.pageRedirect);
    if(this.alert){
      this.alert.dismiss();
    }
  }

  getCheckInSiteName(): string {
    return this.model.SiteID;
  }

  cancelDetails(): void {
    this.navCtrl.pop();
  }

  checkMeIn(): void {
    clearTimeout(this.pageRedirect);

    let emailValidate = new RegExp('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$');
    let phoneValidate = new RegExp('[0-9]{10}');

    if ((this.checkIn.CheckInName.length < 1) || (!phoneValidate.test(this.checkIn.CheckInPhone)) || (!emailValidate.test(this.checkIn.CheckInEmail))) {
      
      if ((this.checkIn.CheckInName.length < 1) || (this.checkIn.CheckInPhone.length < 1) || (this.checkIn.CheckInEmail.length < 1)) {
        this.createAlert("Please complete all fields.");
        return;
      }

      if (!phoneValidate.test(this.checkIn.CheckInPhone)) {
        this.createAlert("Please enter a valid phone number.");
        return;
      }

      if (!emailValidate.test(this.checkIn.CheckInEmail)) {
        this.createAlert("Please enter a valid email address.");
        return;
      }
    }

    this.presentLoading();
    this.warehouseCheckInService.saveCheckIn(this.checkIn).then(
      wciCheckIn => {
        this.checkIn = wciCheckIn,
        this.app.navCtrl.push(WCIThankYou, {wosid: this.checkIn.WOSID});
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error occurred saving item.");
        this.dismissLoading();
      }
    );
  }

  createAlert(message: string): void {
    this.alert = this.alertCtrl.create({
      title: 'Attention',
      message: message,
      buttons: ['Ok']
    });
    this.alert.present();
  }

  refreshTimeout(): void{
    clearTimeout(this.pageRedirect);
    this.pageRedirect = setTimeout(() => {
      this.app.navCtrl.push(WCIStart);
    }, 180000)
  }
}
