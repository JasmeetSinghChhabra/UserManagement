import { Component } from '@angular/core';
import { ViewController, LoadingController } from 'ionic-angular';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { PickedItem } from '../../../../models/work-order/order-fulfillment';
import { Settings, AppService } from '../../../../services/services';
import { BaseComponent } from '../../../../components/base.component';

@Component({
  selector: 'serial-number-scanner',
  templateUrl: 'serial-number-scanner.html'
})

export class SerialNumberScanner extends BaseComponent {

  pickedItem: PickedItem;
  pickedLocationId: string;
  uom: string = 'Each';
  pickerTitle: string = 'Scan Serial #';
  lotsAndSerialNumbers: [string, string][] = [];
  validationMessage: string = null;
  enableScanTextField: boolean;
  toggleScanFieldText: string;
  serialNumber: string;

  constructor(params: NavParams, public viewCtrl: ViewController, loadingCtrl: LoadingController, private settings: Settings, private app: AppService) {
    super(loadingCtrl);
    this.pickedItem = params.get('pickedItem');
    this.pickedLocationId = params.get('pickedLocationId');
    this.lotsAndSerialNumbers = this.getLotSerialNumberTuples(params.get('lotsAndSerialNumbers'));
    this.validationMessage = params.get('validationMessage');
  }

  ngOnInit(): void {
    try {
      this.settings.load().then(() => {
        let enableScanTextField = this.settings.allSettings["enableScanTextField"];
        let toggleScanFieldText = this.settings.allSettings["toggleScanFieldText"];

        if (enableScanTextField !== undefined) {
          this.enableScanTextField = enableScanTextField;
        } else {
          this.enableScanTextField = false;
        }

        if (toggleScanFieldText !== undefined) {
          this.toggleScanFieldText = toggleScanFieldText;
        } else {
          this.toggleScanFieldText = "Camara scanner enabled";
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

  getLotSerialNumberTuples(lotsAndSerialNumbersMap: Map<string, string[]>): [string, string][] {
    let lotsAndSerialNumbers: [string, string][] = [];
    lotsAndSerialNumbersMap.forEach((serialNumbers: string[], lotNumber: string) => {
      serialNumbers.forEach(serialNumber => {
        lotsAndSerialNumbers.push([lotNumber, serialNumber]);
      });
    });
    return lotsAndSerialNumbers;
  }

  done() {
    let data = { 'action': 'done', pickedLocationId: this.pickedLocationId };
    this.viewCtrl.dismiss(data);
  }

  scan() {
    let data = { 'action': 'scan', pickedLocationId: this.pickedLocationId };
    this.viewCtrl.dismiss(data);
  }

  readSerialNumberText() {
    let data = { 'action': 'readText', 'serialNumber': this.serialNumber, pickedLocationId: this.pickedLocationId };
    this.viewCtrl.dismiss(data);
  }

  readSerialNumberExternalScanEntry() {
    if (!this.app.isiOS()) {
      this.readSerialNumberText();
    }
  }

  getQuantityPending(): number {
    return this.pickedItem.QtyOrdered - this.pickedItem.QtyPick - this.lotsAndSerialNumbers.length;
  }

  getQuantityAvailable(): number {
    let selectedLots = this.pickedItem.InventoryItemLocations.filter(detail => detail.LocationId.toUpperCase() === this.pickedLocationId.toUpperCase());
    let serialNumbersAtPickedLocation = [];
    
    selectedLots.forEach(lot => serialNumbersAtPickedLocation = serialNumbersAtPickedLocation.concat(lot.SerialNumbers));

    this.lotsAndSerialNumbers.forEach(item => {
      const index = serialNumbersAtPickedLocation.indexOf(item[1], 0);
      if (index > -1) {
        serialNumbersAtPickedLocation.splice(index, 1);
      }
    })
    
    return serialNumbersAtPickedLocation.length;
  }

  getUniqueLocationIds(){
    let locationIds = new Set();
    this.pickedItem.InventoryItemLocations.forEach(location => {
      locationIds.add(location.LocationId);
    }) 
    return locationIds;
  }

  updateScannerCopy() {
    this.toggleScanFieldText = "Use External Bluetooth Scanner";
    this.settings.setValue("enableScanTextField", this.enableScanTextField);
    this.settings.setValue("toggleScanFieldText", this.toggleScanFieldText);
    this.settings.save();
  }
}
