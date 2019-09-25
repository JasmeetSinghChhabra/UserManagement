import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, ReceiveMaterialsService, GeoService, AuthService } from '../../services/services';
import { UserTypes, User, POHeader, POLine, POLinePost, LocationItem, POReceiptResponse } from '../../models/models';
import { AppConfig } from '../../app/config/app.config';
import { Helper } from '../../utils/utils';
import { Settings } from '../../services/common/settings.service';
import { NexiusMaterialsScanner } from './components/nexiusmaterials-scanner'
import { RMSiteSearch } from './rm-search';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@Component({
  selector: 'rm-po-detail',
  templateUrl: 'rm-pomaterial-detail.html',
  providers: [ReceiveMaterialsService, BarcodeScanner]
})

export class RMPOMaterialDetail extends BasePage {
  @ViewChild(Content) content: Content;

  status: number = 2;
  skip: number = 0;
  top: number = 10;
  toggled: boolean = false;
  searchText: string = '';
  poHeader: POHeader;
  poHeaders: any[] = [];
  poLines: POLine[];
  poReceiptResponse: POReceiptResponse;

  pickedLine: POLine;
  packingSlip: string;
  currentUser: User;

  isShowLines: boolean = false;
  isShowLocation: boolean = false;
  locationList: any[];
  selectedLocation: LocationItem;
  noData: boolean = false;
  parentPage: any;
  page: string;
  dupescan: boolean = false;
  priorityClass: string;
  viewType: number;
  packingSlipNumber: string;

  constructor(
    public loadingCtrl: LoadingController,
    private navParams: NavParams,
    private receiveMaterialsService: ReceiveMaterialsService,
    private app: AppService,
    private alertCtrl: AlertController,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private barcodeScanner: BarcodeScanner,
    private helper: Helper,
    private settings: Settings,
    private config: AppConfig
  ) {
    super(loadingCtrl);
    this.poHeader = navParams.get('item');
    if (this.poHeader) {
      this.poHeaders.push(this.poHeader);
    }
    this.parentPage = navParams.get('parentPage');
    this.page = 'pending';
    let currentUser = new User();
    currentUser.UserId = auth.userInfo.UserId;
    currentUser.UserType = auth.userInfo.UserTypeDescription;
    currentUser.UserSid = auth.userInfo.UserSId;
    currentUser.UserName = auth.userInfo.UserName;
    currentUser.UserTypeId = auth.userInfo.UserTypeId;
    this.currentUser = currentUser;
    if (config.isProduction || app.isApp()) {
      this.dupescan = false;
    }
  }

  ngOnInit(): void {
    this.getPODetails();
    this.packingSlip = null;
  }

  doRefresh(refresher) {
    this.getPODetails(refresher);
  }

  doPulling(refresher) {
    console.log('Do Pulling...', refresher.progress);
  }

  getPODetails(refresher = null): void {
    this.presentLoading("Loading PO Lines...");
    this.receiveMaterialsService.getPODetails(this.poHeader.PONumber, this.poHeader.SitePTN).then(
      response => {
        if (response) {
          this.poLines = response as POLine[];
          this.noData = this.poLines.length < 1;
          if (this.poLines.filter((element) => (element.QtyRequired - element.QtyReceived) > 0).length > 0) {
            this.getLocationList();
          }
          else {
            this.dismissLoading();
          }
        }
        else {
          this.dismissLoading();
          this.noData = true;
          this.app.showAlert("Alert", "All items associated to the " + this.poHeader.PONumber + " have been received.");
          this.app.navCtrl.pop();
        }
        if (refresher) {
          refresher.complete();
        }
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while retrieving PO Lines. Please try again.");
      }
    );
  }

  getLocationList(): void {
    this.receiveMaterialsService.getLocationList(this.poHeader.RecordID, this.poHeader.SitePTN).then(
      response => {
        this.dismissLoading();
        if (response) {
          this.locationList = response as LocationItem[];
        }
        this.isShowLocation = true;
        this.isShowLines = true;
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while retrieving Locations. Please try again.");
      }
    )
  }

  filterHeadersOfType(type) {
    if (type == 'all') {
      return this.poLines;
    }
    else if (type == 'received') {
      return this.poLines.filter((element) => element.QtyReceived > 0);
    }
    else {
      return this.poLines.filter((element) => (element.QtyRequired - element.QtyReceived) > 0);
    }
  }

  receiveMaterials(calloutNumber: string, poLine: POLine): void {
    //this.presentLoading("Logging in..."+ this.locationList);
    let modal = this.modalCtrl.create(NexiusMaterialsScanner, {
      packingSlip: this.packingSlipNumber,
      pickedLine: poLine,
      selectedLocation: LocationItem,
      locationList: this.locationList

    });

    modal.onDidDismiss(data => {
      if (data) {
        if (data.action == 'confirm') {
          let poLineReceipt = new POLinePost();
          poLineReceipt.InvLocID = data.LocationID;
          poLineReceipt.ItemLot = data.assetTag;
          poLineReceipt.ItemSerial = data.serialNumber;
          poLineReceipt.LocNumber = "1";
          poLineReceipt.POLineID = data.poLineID;
          poLineReceipt.PackingSlip = data.packingSlip;
          poLineReceipt.Qty = data.receivedQty;
          poLineReceipt.PONumber = this.poHeader.PONumber;
          poLineReceipt.ReceiptType = "Nexius"

          this.presentLoading("Posting PO Line Receipt...");
          this.receiveMaterialsService.postPOReceipt(poLineReceipt).then(
            poReceiptResponse => {
              this.dismissLoading();
              this.poReceiptResponse = poReceiptResponse as POReceiptResponse;
              let responseStatus = this.poReceiptResponse.Status;
              if (responseStatus.toLowerCase() == "success") {
                poLine.QtyReceived = Number(poLine.QtyReceived) + Number(poLineReceipt.Qty);
                console.log("Post PO Line Receipt was successful.");
                this.app.showToast("PO Receipt posted successfully!", "success");
              }
              else {
                console.log("Post PO Line Receipt was NOT successful: " + this.poReceiptResponse.Message);
                this.app.showErrorToast("An error occurred while posting PO Receipt. Please try again. (Service Response)");
              }
            },
            error => {
              this.dismissLoading();
              console.error(error);
              this.app.showErrorToast("An error occurred while posting PO Receipt. Please try again. (Error Response)");
            }
          );
        }
        else if (data.action != "cancel") {
          this.app.showAlert("Notice", "An unexpected action was sent by the Received Qty form.");
        }
      }
      else {
        this.app.showAlert("Notice", "No data was received from the Received Qty form.");
      }
    });
    modal.present();
  }

  RMComplete(): void {
    let alert = this.alertCtrl.create({
      title: "Confirm",
      message: "Are you sure you have received all the materials?",
    });
    alert.addButton({
      text: 'Yes',
      handler: () => {
        if (this.parentPage.page == "search") {
          this.app.navCtrl.remove(2, 1);
          this.navParams.get("parentPage").clearFields();
          this.app.navCtrl.pop();
        }
        else {
          this.app.navCtrl.pop();
          this.navParams.get("parentPage").clearFields();
        }
      }
    });
    alert.addButton('No');
    alert.present();
  }

  getLocationID(locationName: string) {
    let thisOne = this.locationList.find(location => location.LocationName == locationName)
    return thisOne.LocationID;
  }

  cancel(): void {
    if (this.parentPage.page == "search") {
      this.app.navCtrl.remove(2, 1);
      this.app.navCtrl.pop();
    }
    else {
      this.app.navCtrl.pop();
    }
  }

  scanPackingSlipNumber() {
    this.barcodeScanner.scan().then(barcodeData => {
      this.packingSlipNumber = barcodeData.text;
    }, () => {
      this.app.showErrorToast("An error occurred while accessing the barcode scanner. Please try again.");
    });
  }

}
