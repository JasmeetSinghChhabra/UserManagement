import { Component, ViewChild } from '@angular/core';
import { NavParams, LoadingController, Content, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, ReceiveMaterialsService, AuthService } from '../../services/services';
import { User, POHeader, POLine, POLinePost, LocationItem, POReceiptResponse } from '../../models/models';
import { AppConfig } from '../../app/config/app.config';
import { Helper } from '../../utils/utils';
import { Settings } from '../../services/common/settings.service';
import { MaterialsScanner } from './components/materials-scanner'
import { PrintOptions, Printer } from '@ionic-native/printer';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@Component({
  selector: 'rm-po-detail',
  templateUrl: 'rm-po-detail.html',
  providers: [ReceiveMaterialsService, Printer, BarcodeScanner]
})

export class RMPODetail extends BasePage {
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

  constructor(
    public loadingCtrl: LoadingController,
    private navParams: NavParams,
    private receiveMaterialsService: ReceiveMaterialsService,
    private printer: Printer,
    private app: AppService,
    private barcodeScanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private auth: AuthService,
    private modalCtrl: ModalController,
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
    this.packingSlip = this.poHeader.CalloutNumber;
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
          this.app.showAlert("Notice", this.poHeader.PONumber + " does not have any PO Lines to receive.");
          this.app.navCtrl.pop();
        }

      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while retrieving PO Lines. Please try again.");
      }
    );
    if (refresher) {
      refresher.complete();
    }
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

    let modal = this.modalCtrl.create(MaterialsScanner, {
      packingSlip: this.poHeader.CalloutNumber,
      pickedLine: poLine,
      selectedLocation: this.selectedLocation.LocationName
    });

    modal.onDidDismiss(data => {
      if (data) {
        if (data.action == 'confirm') {
          let poLineReceipt = new POLinePost();
          poLineReceipt.InvLocID = this.selectedLocation.LocationID;
          poLineReceipt.ItemLot = data.assetTag;
          poLineReceipt.ItemSerial = data.serialNumber;
          poLineReceipt.LocNumber = "1";
          poLineReceipt.POLineID = data.poLineID;
          poLineReceipt.PackingSlip = data.packingSlip;
          poLineReceipt.Qty = data.receivedQty;
          poLineReceipt.PONumber = this.poHeader.PONumber;
          poLineReceipt.ReceiptType = "EPL"

          this.presentLoading("Performing Receipt Operation...");
          this.receiveMaterialsService.postPOReceipt(poLineReceipt).then(
            poReceiptResponse => {
              this.dismissLoading();
              this.poReceiptResponse = poReceiptResponse as POReceiptResponse;
              let responseStatus = this.poReceiptResponse.Status;
              if (responseStatus.toLowerCase() == "success") {
                let oldQty: any;
                let receivedQty: any;
                oldQty = poLine.QtyReceived;
                receivedQty = poLineReceipt.Qty;
                poLine.QtyReceived = parseInt(oldQty) + parseInt(receivedQty);
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

  completeReceipt(): void {
    if (this.parentPage.page == "search") {
      this.app.navCtrl.remove(2, 1);
      this.navParams.get("parentPage").clearFields();
      this.app.navCtrl.pop();
    }
    else {
      this.navParams.get("parentPage").clearFields();
      this.app.navCtrl.pop();
    }
  }

  showPrintOptions() {
    let alert = this.alertCtrl.create({
      title: "Receipt Complete",
      message: "Enter how many printed copies are needed if you wish to continue.",
      inputs: [
        {
          name: 'printQuantity',
          placeholder: '# printed copies'
        }
      ]
    });

    alert.addButton({
      text: 'Continue',
      handler: data => {
        if ((/^\+?(0|[1-9]\d*)$/.test(data.printQuantity)) && (data.printQuantity < 11)) {
          if (data.printQuantity > 0) {
            this.sendPrintouts(data.printQuantity);
          }
        }
        else {
          alert.setMessage("Not a valid print quantity!");
          let newAlert = this.alertCtrl.create({
            title: "Invalid Input",
            message: "Invalid number of copies! Please try again."
          });
          newAlert.addButton({
            text: "Ok",
            handler: () => {
              this.showPrintOptions();
            }
          })
          newAlert.present();
        }
      }
    });

    alert.addButton('Cancel');
    alert.present();
  }

  sendPrintouts(printQuantity: number) {

    let pageIndexSize = "50px";
    let labelSize = "55px";
    let valueSize = "100px";
    let maxChars = 13;

    let imageURL = this.config.endpoint + "/Content/Nexius_Logo_Grey_Orange.png";

    let messageDetails = "<html><body>";

    messageDetails += '<style type="text/css"> html, body { height: calc(100%-10px); width: calc(100%-10px); padding: 0px; margin:0px} div { padding: 0px; margin: 0px;}';

    if (printQuantity > 1) {
      messageDetails += '.labelBodyPageBreak { transform:scale(0.9); height: calc(100%-10px); width: calc(100%-10px);page-break-before: always;}';
      messageDetails += '.labelBody { transform:scale(0.9); height: calc(100%-10px);width: calc(100%-10px);}';
    }

    messageDetails += '</style>';

    for (let i = 0; i < printQuantity; i++) {
      if (i > 0) {
        messageDetails += "<div class='labelBodyPageBreak'>";
      }
      else {
        messageDetails += "<div class='labelBody'>";
      }

      messageDetails += "<table border=0 width='100%'>";
      messageDetails += "<tr><td><img src='" + imageURL + "' style='width: 265px; margin-bottom: 20px;'></td>";
      messageDetails += "<td style='padding: 1px; text-align: right; font-family: Times New Roman; font-size: " + pageIndexSize + ";'>" + (i + 1) + " of " + printQuantity + "</td><tr></table>";

      messageDetails += "<table border=1 width='100%'>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>Site</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.poHeader.SiteId + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>PTN</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.poHeader.SitePTN + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>Callout</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.truncateString(this.poHeader.CalloutNumber, maxChars) + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>Location</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.selectedLocation.LocationName + "</td></tr>";
      messageDetails += "</table>";
      messageDetails += "</div>";

    }
    messageDetails += "</body></html>";

    let printOptions: PrintOptions = {
      name: "AccuV_CP_RM_" + this.poHeader.PONumber,
      landscape: true,
      duplex: true
    };

    let printer = this.printer;
    printer.check().then(
      printerInfo => {
        printer.print(messageDetails, printOptions).then(
          printed => {
            if (printed) {
              this.completeReceipt();
              this.app.showSuccessToast("Print Job complete!");
            }
            else {
              this.showTryPrintAgainConfirmation("Printing was canceled. Do you want to try again?", printQuantity);
            }
          },
          error => {
            this.showTryPrintAgainConfirmation("Printing failed. Do you want to try again?", printQuantity);
          }
        );
      },
    );
  }

  showTryPrintAgainConfirmation(message: string, printQuantity: number) {
    let alert = this.alertCtrl.create({
      title: "Confirm",
      message: message,
    });
    alert.addButton({
      text: 'Yes',
      handler: () => {
        this.sendPrintouts(printQuantity);
      }
    });
    alert.addButton({
      text: 'No',
      handler: () => {
        this.completeReceipt();
        this.app.dismissLoading();
        this.app.navCtrl.pop();
      }
    });
    alert.present();
  }

  truncateString(inComingString: string, maxLength: number) {
    if (inComingString == null) {
      return "";
    }
    else {
      if (inComingString.length > maxLength) {
        return inComingString.substr(0, maxLength);
      }
      else {
        return inComingString;
      }
    }
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

  doRefresh(refresher) {
    this.getPODetails(refresher);
  }

  doPulling(refresher) {
    //console.log('Do Pulling...', refresher.progress);
  }

  isShowReceiveButton(poLine: POLine): boolean {
    if (this.selectedLocation) {
      if ((poLine.QtyRequired - poLine.QtyReceived) > 0) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  scanLocation() {
    this.barcodeScanner.scan().then(barcodeData => {
      this.selectedLocation = this.locationList.find(loc => loc.LocationName == barcodeData.text);
    }, () => {
      this.app.showErrorToast("An error occurred while accessing the barcode scanner. Please try again.");
    });
  }
}
