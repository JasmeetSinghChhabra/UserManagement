import { Component, ViewChild } from '@angular/core';
import { NavController, Alert, DateTime } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, AuthService, WarehouseCheckInService, SignatureService } from '../../services/services';
import { WarehouseCheckInModel, WCISite } from '../../models/models';
import { Helper } from '../../utils/utils';
import { WCICheckInDetails } from './wci-check-in-details';
import { WCIStart } from './wci-start';
import { isDate } from 'moment';

@Component({
  selector: 'wci-site-search',
  templateUrl: 'wci-site-search.html',
  providers: [WarehouseCheckInService]
})
export class WCISiteSearch extends BasePage {

  @ViewChild('wciSiteSearch') public wciSiteSearch: NgForm;

  model: any;
  page: string;
  searchText: string;
  foundSite: WCISite;
  wciSites: WCISite[];
  wciOriginalSiteList: WCISite[];
  pageRedirect: any;
  alert: Alert;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams,
    private warehouseCheckInService: WarehouseCheckInService, private app: AppService, private auth: AuthService, private signatureService: SignatureService,
    private alertCtrl: AlertController, private modalCtrl: ModalController, private helper: Helper,
    public navCtrl: NavController) {
    super(loadingCtrl);
  }

  ngOnInit(): void {
    this.pageRedirect = setTimeout(() => {
      this.app.navCtrl.push(WCIStart);
    }, 120000)
  }

  ionViewWillLeave(){
    clearTimeout(this.pageRedirect);
    if(this.alert){
      this.alert.dismiss();
    }
  }

  cancelSearch(): void {
    this.navCtrl.pop();
  }

  siteSearch(): void {
    clearTimeout(this.pageRedirect);
    if (this.searchText) {
      this.presentLoading();
      this.warehouseCheckInService.siteSearch(this.searchText).then(
        data => {
          this.foundSite = data as WCISite;
          if (this.foundSite) {
            this.dismissLoading();
            this.warehouseCheckInService.getCheckInStatus(this.foundSite.WOSID).then(
              alreadyCheckedIn => {
                if (alreadyCheckedIn) {
                  this.createBasicAlert("Check In Status", "This site <" + this.searchText + "> has already been checked in for today.");
                } else {
                  this.confirmGCCompanyAndNavigateToCheckinPage();
                }
              });
          }
          else {
            this.dismissLoading();
            this.confirmationAlert(this.searchText);
          }
        },
        error => {
          this.refreshTimeout();
          console.error(error);
          this.dismissLoading();
          this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
        }
      );
    }
  }

  refreshTimeout(): void{
    clearTimeout(this.pageRedirect);
    this.pageRedirect = setTimeout(() => {
      this.app.navCtrl.push(WCIStart);
    }, 180000)
  }

  private confirmGCCompanyAndNavigateToCheckinPage() {
    this.alert = this.alertCtrl.create({
      title: "Confirmation",
      message: "Are you from " + this.foundSite.GCName.substring(0, this.foundSite.GCName.indexOf("(")) + "?",
      buttons: [
        {
          text: 'Yes',
          handler: data => {
            this.app.navCtrl.push(WCICheckInDetails, {
              item: this.foundSite,
              parentPage: this
            });
          }
        },
        {
          text: "No",
          role: 'cancel',
          handler: data => {
            this.refreshTimeout();
            console.log('No clicked');
          }
        }
      ]
    });
    this.alert.present();
    this.refreshTimeout()
  }

  private createBasicAlert(title: string, message: string){
    this.alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [{
        text: 'Ok',
        handler: data => {
          this.refreshTimeout();
        }
      }]
    });
    this.alert.present();
  }

  confirmationAlert(site: string): void {
    this.alert = this.alertCtrl.create({
      title: "Site Confirmation",
      message: "Are you sure you are searching for site ID " + site + " ?",
      buttons: [
        {
          text: 'Yes',
          handler: data => {
            this.createBasicAlert("Attention", "Unable to find site " + site + " for pickup today. Please contact the warehouse team.");
            this.refreshTimeout();
          }
        },
        {
          text: "No",
          role: 'cancel',
          handler: data => {
            this.refreshTimeout();
            console.log('No clicked');
          }
        }
      ]
    });
    this.alert.present();
    this.refreshTimeout();
  }
}
