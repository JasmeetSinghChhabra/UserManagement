import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, AuthService, ReceiveMaterialsService } from '../../services/services';
import { Helper } from '../../utils/utils';
import { Settings } from '../../services/common/settings.service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AppConfig } from '../../app/config/app.config';
import { RMPOMaterialDetail } from './rm-pomaterial-detail';

@Component({
  selector: 'rm-materialsearch',
  templateUrl: 'rm-materialsearch.html',
  providers: [BarcodeScanner, ReceiveMaterialsService]
})
export class RMSiteSearchMaterial extends BasePage {
  model: any;
  page: string;
  searchPONumber: string;

  constructor(
    loadingCtrl: LoadingController,
    private navParams: NavParams,
    private barcodeScanner: BarcodeScanner,
    private app: AppService,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private receiveMaterialsService: ReceiveMaterialsService,
    private helper: Helper,
    public navCtrl: NavController,
    private settings: Settings,
    private config: AppConfig

  ) {
    super(loadingCtrl);
    this.page = "search";
  }

  getReceiverName(): string {
    return "Nexius Materials";
  }
  cancelSearch(): void {
    this.navCtrl.pop();
  }

  poSearch(): void {
    if (this.searchPONumber && (this.searchPONumber.length > 0)) {
      if (!this.searchPONumber.startsWith("PO-")) {
        this.searchPONumber = "PO-" + this.searchPONumber;
      }
      this.getPOList(this.searchPONumber);
    }
    else {
      this.app.showAlert("Alert", "Cannot search empty PO #.");
    }
  }

  getPOList(searchText: string): void {
    this.presentLoading("Retrieving POs...");
    this.receiveMaterialsService.getPurchaseOrdersByPONumber(searchText).then(
      response => {
        this.dismissLoading();
        if (response && response.length > 0) {
          let POHeadersNotReceived = response.filter(po => po.Status != "5-Vendor Notified - All Lines Fully Received");
          if (POHeadersNotReceived.length < 1) {
            this.app.showAlert("Alert", "All items associated to the " + searchText + " have been received.");
          }
          else {
            this.app.navCtrl.push(RMPOMaterialDetail, {
              item: POHeadersNotReceived[0],
              "parentPage": this
            });
          }
        }
        else {
          this.app.showAlert("PO Not Found", searchText + " was not found.");
        }
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while retrieving POs. Please try again.");
      }
    );
  }

  scanPO() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.processPOScan(barcodeData.text.trim());
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing barcode scanner. Please try again.");
    });
  }

  processPOScan(searchPO) {
    this.searchPONumber = searchPO;
    this.poSearch();
  }

  clearFields(): void {
    this.searchPONumber = "";
  }

}
