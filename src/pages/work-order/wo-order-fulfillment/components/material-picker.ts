import { Component } from '@angular/core';
import { ViewController, LoadingController } from 'ionic-angular';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { ViewChild } from '@angular/core';
import { PickedItem, InventoryItemLocation } from '../../../../models/work-order/order-fulfillment';
import { BaseComponent } from '../../../../components/base.component';

@Component({
  selector: 'material-picker',
  templateUrl: 'material-picker.html'
})

export class MaterialPicker extends BaseComponent {

  @ViewChild('pickQty') pickQtyInput;
  pickedItem: PickedItem;
  pickedLocation: InventoryItemLocation;
  lotNumber: string;
  pickInProgressQty: number;
  uom: string = 'Each';
  pickerTitle: string = 'Picked quantity';
  validationError: string = 'Please enter quantity needed to pick';

  constructor(params: NavParams, public viewCtrl: ViewController, loadingCtrl: LoadingController) {
    super(loadingCtrl);
    this.pickedItem = params.get('pickedItem');
    this.pickedLocation = params.get('pickedLocation');
    this.lotNumber = params.get('lotNumber');
  }

  cancel() {
    let data = { 'action': 'cancel' };
    this.viewCtrl.dismiss(data);
  }

  ionViewDidLoad() {
    setTimeout(() => {
      this.pickQtyInput.setFocus();
    }, 1000);
  }

  confirm() {
    let data = { 'action': 'confirm', 'pickedQty': this.pickInProgressQty, 'pickedLocation': this.pickedLocation };
    this.viewCtrl.dismiss(data);
  }

  validate(data): void {
    this.validationError = null;
    if (data <= 0) {
      this.validationError = 'Quantity entered has to be greater than 0';
    }
    else if (this.getQuantityPending() < 0) {
      this.validationError = 'Quantity entered cannot be greater than needed to pick.';
    }
    else if (this.getQuantityAvailable() < 0) {
      this.validationError = 'Quantity entered cannot be greater than available quantity.';
    }
    else if (this.pickedItem.AllowedDecimals < this.countDecimalPlaces(data)) {
      this.validationError = 'Decimal points entered is more than what is allowed for this item';

    }
  }

  locationChangeValidation(): void {
    this.validationError = null;
    if (this.getQuantityAvailable() < 0) {
      this.validationError = 'Quantity entered cannot be greater than available quantity.';
    }
  }

  countDecimalPlaces(num): number {
    var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) { return 0; }
    return Math.max(
      0,
      // Number of digits right of decimal point.
      (match[1] ? match[1].length : 0)
      // Adjust for scientific notation.
      - (match[2] ? +match[2] : 0));
  }

  getQuantityPending(): number {
    return this.pickedItem.QtyOrdered - this.pickedItem.QtyPick - (this.pickInProgressQty ? this.pickInProgressQty : 0);
  }

  getQuantityPicked(): number {
    return this.pickedItem.QtyPick + (this.pickInProgressQty ? parseInt(this.pickInProgressQty + "") : 0);
  }

  getQuantityAvailable(): number {
    return this.pickedLocation.LocationQty - (this.pickInProgressQty ? this.pickInProgressQty : 0);
  }
}
