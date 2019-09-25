import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, AuthService, ReceiveMaterialsService, GeoService } from '../../services/services';
import { Helper } from '../../utils/utils';
import { RMPOList } from './rm-po-list';
import { POHeader } from '../../models/models';
import { Settings } from '../../services/common/settings.service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AppConfig } from '../../app/config/app.config';
import { RMPODetail } from './rm-po-detail';

@Component({
  selector: 'rm-search',
  templateUrl: 'rm-search.html',
  providers: [BarcodeScanner, ReceiveMaterialsService]
})
export class RMSiteSearch extends BasePage {
  model: any;
  page: string;
  searchText: string = '';
  POHeaders: POHeader[];
  searchBy: string;
  SEARCHBY_CALLOUTNO = "Callout #";
  SEARCHBY_JOBNO = "Job #";
  SEARCHBY_PTN = "PTN";
  
  constructor(
    loadingCtrl: LoadingController,
    private receiveMaterialsService: ReceiveMaterialsService,
    private navParams: NavParams,
    private barcodeScanner: BarcodeScanner,
    private app: AppService,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private helper: Helper,
    public navCtrl: NavController,
    private settings: Settings,
    private config: AppConfig

  ) {
    super(loadingCtrl);
    this.page = "search";
    this.searchBy = this.SEARCHBY_CALLOUTNO;
  }

  getReceiverName(): string {
    return "EPL";
  }
  
  cancelSearch(): void {
    this.navCtrl.pop();
  }

  clearFields(): void {
    this.searchText = "";
  }

  siteSearch(): void {
    if ((this.searchText && (this.searchText.length > 0))) {
      this.presentLoading("Retrieving Purchase Orders...");
      let searchCallout = this.searchBy == this.SEARCHBY_CALLOUTNO ? this.searchText : "";
      this.receiveMaterialsService.siteSearch(this.searchText, searchCallout).then(
        response => {
          this.dismissLoading();
          if (response) {
            this.processResponse(response);
          }
          else {
            this.app.showAlert("PO Not Found", "No Purchase Order was found associated to the " + this.searchBy + " " + this.searchText);
          }
        },
        error => {
          console.error(error);
          this.dismissLoading();
          this.app.showErrorToast("An error occurred while retrieving POs. Please try again.");
        }
      );
    }
    else {
      this.app.showAlert("Alert", "Cannot search on empty " + this.searchBy + ".");
    }
  }

  processResponse(response: any): void {
    this.POHeaders = response as POHeader[];
    if (this.POHeaders.length < 1) {
      this.app.showAlert("PO Not Found", "No Purchase Order was found associated to the " + this.searchBy + " " + this.searchText);
    }
    else {
      this.POHeaders = this.POHeaders.filter(po => po.Status.toLowerCase().indexOf("all lines fully received") == -1);
      if (this.POHeaders.length < 1) {
        let message = (this.searchBy == this.SEARCHBY_CALLOUTNO ) ? "Callout # " + this.searchText : "Site " + this.searchText;
        this.app.showAlert("Alert", "All items associated to the " + this.searchBy + " " + this.searchText + " have been received.");
      }
      else if (this.POHeaders.length > 1) {
        this.app.navCtrl.push(RMPOList, {
          POHeaders: this.POHeaders,
          "parentPage": this
        });

      }
      else if (this.POHeaders.length == 1) {
        this.app.navCtrl.push(RMPODetail, {
          item: this.POHeaders[0],
          "parentPage": this
        });
      }
    }
  }

  scanCallout() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.processCalloutScan(barcodeData.text.trim());
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing barcode scanner. Please try again.");
    });
  }

  processCalloutScan(searchCallout) {
    if (searchCallout) {
      this.searchText = searchCallout;
      this.siteSearch();
    }
  }

}
