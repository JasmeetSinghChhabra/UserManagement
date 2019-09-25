import { Component } from '@angular/core';
import { ViewController, LoadingController } from 'ionic-angular';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { ViewChild } from '@angular/core';
import { POLine, POLinePost, LocationItem } from '../../../models/models';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Settings, AppService } from '../../../services/services';
import { BaseComponent } from '../../../components/base.component';


enum ScanTypes {
  SERIAL_NO = 0,
  ASSET_TAG = 1
}

@Component({
  selector: 'nexiusmaterials-scanner',
  templateUrl: 'nexiusmaterials-scanner.html',
  providers: [BarcodeScanner]
})

export class NexiusMaterialsScanner extends BaseComponent {
  @ViewChild('pickQty') pickQtyInput;

  pickedLine: POLine;
  selectedLocation: LocationItem;
  poLinePost: POLinePost;
  title: string = "Receive Item";
  pickInProgressQty: number;
  readyToPost: boolean = false;
  validateFormMessage: string = "";
  hasValidQuantity: boolean = false;
  lastScannedType: ScanTypes = ScanTypes.SERIAL_NO;

  locationList: any[];
  serialNumber: string;
  assetTag: string;
  packingSlip: string = "";
  lotsAndSerialNumbers: Map<string, string> = new Map();;

  constructor(
    params: NavParams,
    public viewCtrl: ViewController,
    loadingCtrl: LoadingController,
    private barcodeScanner: BarcodeScanner,
    private settings: Settings,
    private app: AppService) {
    super(loadingCtrl);
    this.packingSlip = params.get('packingSlip');
    this.locationList = params.get('locationList');
    this.pickedLine = params.get('pickedLine');
    this.readyToPost = params.get('readyToPost');
    this.poLinePost = new POLinePost;
    this.poLinePost.POLineID = this.pickedLine.POLineID;
  }

  ngOnInit(): void {
    this.setValidationMessage();
  }

  cancel() {
    let data = { 'action': 'cancel' };
    this.viewCtrl.dismiss(data);
  }

  ionViewDidLoad() {
    setTimeout(() => {
      if (this.pickQtyInput) {
        this.pickQtyInput.setFocus();
      }
    }, 1000);
  }

  setValidationMessage(): void {
    this.validateFormMessage = "";
    if (this.isShowTrackedField(this.pickedLine.SerialTracked) && !this.poLinePost.ItemSerial) {
      this.validateFormMessage = "Please provide Serial #(s)";
      if (this.isShowTrackedField(this.pickedLine.LotTracked) && !this.poLinePost.ItemLot) {
        this.validateFormMessage += ", and Asset Tag(s)";
      }
    }
    else if (this.isShowTrackedField(this.pickedLine.LotTracked) && !this.poLinePost.ItemLot) {
      this.validateFormMessage += "Please provide Asset Tag(s)";
    } else if (!this.isShowTrackedField(this.pickedLine.LotTracked) && !this.isShowTrackedField(this.pickedLine.SerialTracked) && !this.hasValidQuantity) {
      this.validateFormMessage = "Please provide Quantity";
    }
    else if (!this.selectedLocation) {
      this.validateFormMessage = "Please select location";
    }
  }

  validateQuantity(data): boolean {
    this.hasValidQuantity = false;
    if (data) {
      if (data <= 0) {
        this.validateFormMessage = "Quantity entered has to be greater than 0";
      }
      else if (this.getQuantityPending() < 0) {
        this.validateFormMessage = "Quantity entered cannot be greater than the quantity to be received.";
      }
      else if (this.pickedLine.SerialTracked.toLowerCase() == "yes" || this.pickedLine.SerialTracked.toLowerCase() == "yes") {
        this.hasValidQuantity = true;
        this.setValidationMessage();
      }
      else {
        this.hasValidQuantity = true;
        this.setValidationMessage();
      }
    }
    else {
      this.validateFormMessage = "Please provide Quantity";
    }
    return this.hasValidQuantity;
  }

  dupeCheck(fieldLabel: string, itemList: string): string {
    let items = itemList.split(",");
    let object = {};
    let result: string = "";
    items.forEach(function (item) {
      if (!object[item]) {
        object[item] = 0;
      }
      object[item] += 1;
    });
    for (var item in object) {
      if (object[item] > 1) {
        result += "<li>" + item + " is a duplicate " + fieldLabel;
      }
    }
    return result;
  }

  validateForm(data): boolean {
    let message = "Before confirming, please check or correct the following fields:<ul style='text-align: left;'>"
    this.validateFormMessage = "Please provide";

    if (!data.receivedQty) {
      message += '<li>Quantity';
      this.validateFormMessage += " Quantity";
    }
    else if (!this.validateQuantity(data.receivedQty)) {
      message += '<li>Valid Quantity';
      this.validateFormMessage += " Valid Quantity";
    }

    if (this.pickedLine.SerialTracked.toLowerCase() == "yes") {
      if (!this.poLinePost.ItemSerial) {
        message += "<li>Serial #(s)";
        this.validateFormMessage += (this.validateFormMessage == "Please provide") ? " Serial #(s)" : ", Serial #(s)";
      }
      else {
        let tempSerial = this.poLinePost.ItemSerial;
        let serialCount = 0;
        if (tempSerial) {
          serialCount = tempSerial.split(",").length;
          if (serialCount > 1) {
            message += this.dupeCheck("Serial #", tempSerial);
          }
        }

        if (data.receivedQty && data.receivedQty != serialCount) {
          message += "<li style='text-align: left;'>Serial #(s) - incorrect count";
          this.validateFormMessage += (this.validateFormMessage == "Please provide") ? "  correct Serial # count" : ", correct Serial # count";
        }

      }
    }

    if (this.pickedLine.LotTracked.toLowerCase() == "yes") {
      if (!this.poLinePost.ItemLot) {
        message += "<li style='text-align: left;'>Asset Tag";
        this.validateFormMessage += (this.validateFormMessage == "Please provide") ? " Asset Tag(s)" : ", and Asset Tag(s)";
      }
      else {
        let tempLot = this.poLinePost.ItemLot;
        let lotCount = 0;
        if (tempLot) {
          lotCount = tempLot.split(",").length;
          if (lotCount > 1) {
            message += this.dupeCheck("Asset Tag", tempLot);
          }
        }
      }
    }

    if (message == "Before confirming, please check or correct the following fields:<ul style='text-align: left;'>") {
      this.validateFormMessage = "";
      return true;
    }
    else {
      this.app.showAlert("Notice", message);
      return false;
    }
  }

  confirm() {
    let data = {
      'action': 'confirm',
      'poLineID': this.poLinePost.POLineID,
      'packingSlip': this.packingSlip,
      'receivedQty': this.pickInProgressQty,
      'serialNumber': this.poLinePost.ItemSerial,
      'assetTag': this.poLinePost.ItemLot,
      'LocationID': this.selectedLocation.LocationID
    };
    if (this.validateForm(data)) {
      this.viewCtrl.dismiss(data);
    }
  }

  done() {
    let data = { 'action': 'done' };
    this.viewCtrl.dismiss(data);
  }

  scanSerialNumber() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.serialNumber = barcodeData.text.trim();
      this.processSerialNumberText(barcodeData.text.trim());
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing the barcode scanner. Please try again.");
    });
  }

  scanAssetTag() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.assetTag = barcodeData.text.trim();
      this.processAssetTagText(barcodeData.text.trim());
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing the barcode scanner. Please try again.");
    });
  }

  getQuantityPending(): number {
    return (this.pickedLine.QtyRequired - this.pickedLine.QtyReceived) - (this.pickInProgressQty ? this.pickInProgressQty : 0);
  }

  getQuantityPicked(): number {
    return this.pickedLine.QtyReceived + (this.pickInProgressQty ? this.pickInProgressQty : 0);
  }

  isShowTrackedField(fieldValue: string): boolean {
    return (fieldValue.toLowerCase() == "yes") ? true : false;
  }

  showAssetTagField() {
    if (this.pickedLine.QtyRequired - this.pickedLine.QtyReceived <= this.lotsAndSerialNumbers.size) {
      return false;
    }
    if (this.isShowTrackedField(this.pickedLine.LotTracked) && this.isShowTrackedField(this.pickedLine.SerialTracked)) {
      return this.lastScannedType != ScanTypes.ASSET_TAG;
    }
    else {
      return this.isShowTrackedField(this.pickedLine.LotTracked);
    }
  }

  showSerialNumberField() {
    if (this.isShowTrackedField(this.pickedLine.SerialTracked) && this.isShowTrackedField(this.pickedLine.LotTracked)) {
      return this.lastScannedType != ScanTypes.SERIAL_NO;
    }
    else if (this.pickedLine.QtyRequired - this.pickedLine.QtyReceived <= this.lotsAndSerialNumbers.size
    ) {
      return false;
    } else {
      return this.isShowTrackedField(this.pickedLine.SerialTracked);
    }
  }

  readSerialNumberExternalScanEntry() {
    if (!this.app.isiOS()) {
      this.processSerialNumberText(this.serialNumber);
    }
  }

  readSerialNumberText() {
    this.processSerialNumberText(this.serialNumber);
  }

  processSerialNumberText(serialNumberRead) {
    if (this.poLinePost.ItemSerial) {
      if (this.dupeCheck("Serial #", this.poLinePost.ItemSerial + "," + serialNumberRead) == "") {
        this.poLinePost.ItemSerial += "," + serialNumberRead;
      }
      else {
        this.app.showAlert("Notice", serialNumberRead + " has already been scanned.");
        return;
      }
    }
    else {
      this.poLinePost.ItemSerial = serialNumberRead;
    }
    if (!this.isShowTrackedField(this.pickedLine.LotTracked)) {
      this.lotsAndSerialNumbers.set(serialNumberRead, serialNumberRead);
    }
    else {
      this.lotsAndSerialNumbers.set(serialNumberRead, this.assetTag);
      this.lotsAndSerialNumbers.delete("");
    }
    if (!this.pickInProgressQty) {
      this.pickInProgressQty = 0;
    }
    this.pickInProgressQty++;
    this.assetTag = "";
    this.serialNumber = "";
    this.lastScannedType = ScanTypes.SERIAL_NO;
    this.setValidationMessage();
  }

  readAssetTagExternalScanEntry() {
    if (!this.app.isiOS()) {
      this.processSerialNumberText(this.assetTag);
    }
  }

  readAssetTagText() {
    this.processAssetTagText(this.assetTag);
  }

  processAssetTagText(assetTagRead) {
    if (this.poLinePost.ItemLot) {
      if (this.dupeCheck("Asset Tag", this.poLinePost.ItemLot + "," + assetTagRead) == "") {
        this.poLinePost.ItemLot += "," + assetTagRead;
      }
      else {
        this.app.showAlert("Notice", assetTagRead + " has already been scanned.");
        return;
      }
    }
    else {
      this.poLinePost.ItemLot = assetTagRead;
    }
    if (this.isShowTrackedField(this.pickedLine.SerialTracked)) {
      this.lotsAndSerialNumbers.set("", assetTagRead);
    }
    else {
      this.lotsAndSerialNumbers.set(assetTagRead, assetTagRead);
      if (!this.pickInProgressQty) {
        this.pickInProgressQty = 0;
      }
       
      this.assetTag = "";
    }
    this.serialNumber = "";
    this.lastScannedType = ScanTypes.ASSET_TAG;
    this.setValidationMessage();
  }

  getLotsAndSerialNumberKeys() {
    return Array.from(this.lotsAndSerialNumbers.keys());
  }

  removeReceivedItem(key) {
    if (this.poLinePost.ItemSerial) {
      this.poLinePost.ItemSerial = this.poLinePost.ItemSerial.replace("," + key, "").replace(key, "");
    } if (this.poLinePost.ItemLot) {
      this.poLinePost.ItemLot = this.poLinePost.ItemLot.replace("," + this.lotsAndSerialNumbers.get(key), "").replace(this.lotsAndSerialNumbers.get(key), "");
    }
    this.lotsAndSerialNumbers.delete(key);
    this.lastScannedType = ScanTypes.SERIAL_NO;
    this.pickInProgressQty = this.lotsAndSerialNumbers.size;
    this.assetTag = "";
    this.serialNumber = "";
    this.setValidationMessage();
  }

}


