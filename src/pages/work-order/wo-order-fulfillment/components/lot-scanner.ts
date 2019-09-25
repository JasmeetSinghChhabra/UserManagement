import { Component } from '@angular/core';
import { ViewController, LoadingController } from 'ionic-angular';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { BaseComponent } from '../../../../components/base.component';
import { PickedItem } from '../../../../models/work-order/order-fulfillment';
import { Settings, AppService } from '../../../../services/services';

@Component({
  selector: 'lot-scanner',
  templateUrl: 'lot-scanner.html'
})

export class LotScanner extends BaseComponent {

  pickedItem: PickedItem;
  pickedLocationId: string;
  uom: string = 'Each';
  pickerTitle: string = 'Scan Lot #';
  validationMessage: string = null;
  enableScanTextField: boolean;
  toggleScanFieldText: string;
  lotNumber: string;

  constructor(params: NavParams, public viewCtrl: ViewController, loadingCtrl: LoadingController, private settings: Settings, private app: AppService) {
    super(loadingCtrl);
    this.pickedItem = params.get('pickedItem');
    this.pickedLocationId = params.get('pickedLocationId');
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

  scan() {
    let data = { 'action': 'scan', pickedLocationId: this.pickedLocationId };
    this.viewCtrl.dismiss(data);
  }

  getQuantityPending(): number {
    return this.pickedItem.QtyOrdered - this.pickedItem.QtyPick;
  }

  readLotNumberText() {
    let data = { 'action': 'readText', 'lotNumber': this.lotNumber, pickedLocationId: this.pickedLocationId };
    this.viewCtrl.dismiss(data);
  }

  readLotNumberExternalScanEntry() {
    if (!this.app.isiOS()) {
      this.readLotNumberText();
    }
  }

  getUniqueLocationIds() {
    let locationIds = new Set();
    this.pickedItem.InventoryItemLocations.forEach(location => {
      locationIds.add(location.LocationId);
    })
    return locationIds;
  }

  getPickedLocationQty() {
    let lots = this.pickedItem.InventoryItemLocations.filter(detail => detail.LocationId.toUpperCase() === this.pickedLocationId.toUpperCase());
    let location = {
      Id: lots[0].Id,
      LocationId: lots[0].LocationId,
      LocationQty: 0
    }
    lots.forEach(lot => location.LocationQty += lot.LocationQty);
    return location.LocationQty;
  }

  updateScannerCopy() {

    this.toggleScanFieldText = "Use External Bluetooth Scanner";
    this.settings.setValue("enableScanTextField", this.enableScanTextField);
    this.settings.setValue("toggleScanFieldText", this.toggleScanFieldText);
    this.settings.save();
  }
}
