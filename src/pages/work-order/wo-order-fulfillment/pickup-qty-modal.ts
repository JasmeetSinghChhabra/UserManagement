import { Component, ViewChild } from '@angular/core';
import { ViewController, NavParams, IonicPage } from 'ionic-angular';
import { AppService } from '../../../services/common/app.service';
import { PackedItem } from '../../../models/work-order/order-fulfillment';

@Component({
  selector: 'pickup-qty-modal',
  templateUrl: 'pickup-qty-modal.html'
})

export class PickUpQty {
  @ViewChild('packQty') packQtyInput ;
  packedItem: PackedItem;
  newQty: number;
  validationError: string;

  constructor(public viewCtrl: ViewController, params: NavParams, private app: AppService) {
    this.packedItem = params.data.packedItem;
    this.newQty = this.packedItem.Qty;
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

  saveQty() {
    let data = {'newQty': this.newQty};
    this.viewCtrl.dismiss(data);
  }

  getStatusClass(button: number){
    if (button == 0){
      if (this.canGoUp()){
        return "enabled";
      } else {
        return "disabled";
      }
    } else {
      if (this.canGoDown()){
        return "enabled";
      } else {
        return "disabled";
      }
    }
  }

  validate(data) : void {
    this.validationError = null;
    if(this.newQty < 0){
      this.validationError ='Quantity entered has to be greater than 0';
    }
    else if (this.newQty > this.packedItem.originalQty) {
      this.validationError ='Quantity entered cannot be greater than what is picked';
    }  
  }
  
  canGoUp(): boolean{
    if (this.newQty < this.packedItem.originalQty){
      return true;
    } else {
      return false;
    }
  }

  canGoDown(){
    if (this.newQty > 0){
      return true;
    } else {
      return false;
    }
  }

  add(){
    if (this.canGoUp()){
      this.newQty = this.newQty + 1;
    }
  }

  substract(){
    if (this.canGoDown()){
      this.newQty = this.newQty - 1;
    }
  }


}