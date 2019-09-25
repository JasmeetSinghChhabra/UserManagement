import { Component } from '@angular/core';
import { BasePage } from '../../base.page';
import { NavController, NavParams, LoadingController, ModalController, ItemSliding } from 'ionic-angular';
import { AppService, WarehouseCheckInService } from '../../../services/services';
import { Signature } from './signature-modal';
import { PickUpQty } from './pickup-qty-modal';
import { PackedItem } from '../../../models/work-order/order-fulfillment';
import { WorkOrderModel } from '../../../models/models';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';

/**
 * Generated class for the GcPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-gc-pick',
  templateUrl: 'gc-pick.html',
  providers: [WarehouseCheckInService]
})
export class GcPickPage extends BasePage {

  toBePackedItems: PackedItem[];
  packedItems: PackedItem[];
  savedActionItems: PackedItem[];

  workOrder: WorkOrderModel;
  isPickPending: boolean;
  WODetails: any;
  GCPickupFormKey: any;
  isChecked: boolean;

  soId: any;
  gcName: string;
  gcEmail: string;

  public alertShown: boolean = false;

  constructor(
    loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private app: AppService,
    private modalCtrl: ModalController,
    private storage: Storage,
    private alertCtrl: AlertController,
    private warehouseCheckInService: WarehouseCheckInService
  ) {
    super(loadingCtrl);

    this.WODetails = navParams.get('soLines');
    this.workOrder = navParams.get('workOrder');
    this.isPickPending = navParams.get('isPickPending');
    this.toBePackedItems = [];
    this.packedItems = [];
    this.isChecked = false;
    this.gcName = "";
    this.gcEmail = "";
    this.soId = navParams.get('soId');

    this.GCPickupFormKey = "GCPickupForm_" + this.workOrder.WorkOrderSID;

    this.WODetails.forEach(woDetail => {
      if (woDetail.SoLines && woDetail.SoLines.length > 0) {
        woDetail.SoLines.forEach(item => {
          let qtyToPackAndShip = item.QtyPick - item.QtyPack;
          if (qtyToPackAndShip > 0) {
            let packedItem: PackedItem = new PackedItem();
            packedItem.ItemLot = item.ItemLot;
            packedItem.ItemIsSerial = item.ItemIsSerial;
            packedItem.SOLineId = item.Id;
            packedItem.UOM = item.Uom;
            packedItem.Qty = qtyToPackAndShip;
            packedItem.originalQty = packedItem.Qty;
            packedItem.ItemName = item.ItemName;
            packedItem.LineNumber = item.Line;
            packedItem.JobName = item.Job;
            this.toBePackedItems.push(packedItem);
          }
        });
      }
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad GcPickPage');

//  if there is already an instance of the form saved for this WOSID, update the form's items accordingly.
    this.storage.get(this.GCPickupFormKey).then((gcPickupForm) => {
      if (gcPickupForm == null) {
        console.log('First visit for this GCPickupForm: ' + this.GCPickupFormKey);
      }
      else {
        console.log('Not first visit. GCPickupForm: ' + gcPickupForm);
        let actionsArray = gcPickupForm["actions"];
        actionsArray.forEach(action => {
          let soID = action.SOLineId;
          let savedItem = this.toBePackedItems.find(i => i.SOLineId == soID);
          savedItem.Qty = action.Qty;
          if (action.IsChecked) {
            this.packedItems.push(savedItem);
            console.log('updating checked status to checked')
          }
          else {
            console.log('updating item Qty only')
          }
        });
      }
    });
    
    this.getDetailsPackingSlip();
  }

  isItemSelected(wod) {
    let index = this.packedItems.indexOf(wod);
    if (index == -1) {
      return false;
    } else {
      return true;
    }
  }

  getIcon(wod) {
    if (this.isItemSelected(wod)) {
      return "checkbox";
    } else {
      return "square-outline";
    }
  }

  itemTapped(event, item) {

    
    if (this.isItemSelected(item)) {
      let index = this.packedItems.indexOf(item);
      if (index > -1) {
        this.packedItems.splice(index, 1);
        this.isChecked = false;
      }
    } else {
      this.packedItems.push(item);
      this.isChecked = true;
    }

    let formActionInfo = { "SOLineId": item.SOLineId, "IsChecked": this.isChecked, "Qty": item.Qty };
    this.updateGCPickupFormStorage(this.GCPickupFormKey, formActionInfo, "itemTapped");
  }


  cancel() {

    this.storage.get(this.GCPickupFormKey).then((gcPickupForm) => {
      if (gcPickupForm == null) {
        console.log('No saved actions for this GCPickupForm: ' + this.GCPickupFormKey);
        this.app.navCtrl.pop();
      }
      else {

        let alert = this.alertCtrl.create({
          title: 'Confirm Cancel',
          message: 'Lose all changes?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
                this.alertShown = false;
              }
            },
            {
              text: 'Yes',
              handler: () => {
                console.log('Removing saved actions for GCPickupForm: ' + gcPickupForm);
                this.storage.remove(this.GCPickupFormKey);
                this.app.navCtrl.pop();
              }
            }
          ]
        });
        alert.present().then(() => {
          this.alertShown = true;
        });
      }
    });
  }

  continue() {

    let pendingItems: PackedItem[] = [];
    this.WODetails.forEach(woDetail => {
      if (woDetail.SoLines && woDetail.SoLines.length > 0) {
        woDetail.SoLines.forEach(item => {
          let qtyToShip = item.QtyOrdered - item.QtyShip;
          let packedItem = this.packedItems.find(itemP => itemP.SOLineId == item.Id);
          if (packedItem) {
            qtyToShip -= packedItem.Qty;
          }

          if (qtyToShip > 0) {
            let pendingItem: PackedItem = new PackedItem();
            pendingItem.SOLineId = item.Id;
            pendingItem.LineNumber = item.Line;
            pendingItem.Qty = qtyToShip;
            pendingItem.UOM = item.Uom;
            pendingItem.ItemName = item.ItemName;
            pendingItem.JobName = item.Job;
            pendingItems.push(pendingItem);
          }
        });
      }
    });

    let modal = this.modalCtrl.create(Signature, {
      packedItems: this.packedItems,
      pendingItems: pendingItems,
      workOrder: this.workOrder,
      soId: this.soId,
      gcName: this.gcName,
      gcEmail: this.gcEmail,
      allPickedAndPacked: this.allPacked() && !this.isPickPending
    });

    modal.onDidDismiss(data => {
      if (!data) {
        return;
      } else {
        this.navCtrl.popToRoot();
      }
    });
    modal.present();
    this.storage.remove(this.GCPickupFormKey);
  }

  allPacked(): boolean {
    if (!this.allSelected()) {
      return false;
    }
    let allPacked = true;
    this.toBePackedItems.forEach(toBePackedItem => {
      let packedItem: PackedItem = this.packedItems.find(itemP => itemP.SOLineId == toBePackedItem.SOLineId);
      if (!packedItem) {
        allPacked = false;
      }
      if (packedItem.Qty < toBePackedItem.originalQty) {
        allPacked = false;
      }
      if (packedItem.Qty > toBePackedItem.originalQty) {
        console.log("Something is wrong. We should never reach this point");
      }
    });
    return allPacked;
  }

  allSelected(): boolean {
    if (this.toBePackedItems.length == this.packedItems.length) {
      return true;
    } else {
      return false;
    }
  }

  editQty(event, slidingItem: ItemSliding, item) {
    slidingItem.close();
    if (item.ItemIsSerial) {
      this.app.showErrorToast("This is a serialized item and can't be modified!");
    } else {
      let modal = this.modalCtrl.create(PickUpQty, {
        packedItem: item
      });
      modal.onDidDismiss(data => {
        if (data) {
          let isChanged = false;
          if (item.Qty != data.newQty) {
            isChanged = true;       //  do it this way so we add the Storage after the item updating takes place. It might matter. Not sure. JPM 12/3/2018.
          }
          item.Qty = data.newQty;

          if (isChanged) {
            let formActionInfo = { "SOLineId": item.SOLineId, "IsChecked": item.IsChecked, "Qty": item.Qty };
            this.updateGCPickupFormStorage(this.GCPickupFormKey, formActionInfo, "editQty");
          }

        }
      });
      modal.present();
    }
  }

  updateGCPickupFormStorage(gcPickupFormKey, formInfo, callingFunction) {
    this.storage.get(this.GCPickupFormKey).then((gcForm) => {
      if (gcForm == null) {
        if (callingFunction == "editQty") {
          formInfo["IsChecked"] = false;      //the only way we could be here is the User's first action AT ALL is to change Qty before itemTapped/checkbox change. So checkbox would be unchecked.
        }
        let actionArray = [formInfo];
        let actionsObject = { "actions": actionArray };
        this.storage.set(this.GCPickupFormKey, actionsObject);
      }
      else {
        let isNew = true;
        let soLineId = formInfo.SOLineId;

        if (callingFunction == "editQty") {
          formInfo["IsChecked"] = false;      //the only way we could be here is the User's first action ON THIS ITEM is to change Qty before itemTapped/checkbox change. So checkbox would be unchecked.
        }
        console.log("Updating SOLineID #" + soLineId);
        let actionsArray = gcForm["actions"];
        for (let i = 0; i < actionsArray.length; i++) {
          let lineID = actionsArray[i]["SOLineId"];
          console.log("Checking lineID #" + lineID);
          if (lineID == soLineId) {
            if (callingFunction == "editQty") {
              formInfo["IsChecked"] = actionsArray[i]["IsChecked"];   // if we are changing Qty we want to preserve existing IsChecked value.
            }
            console.log("Updating lineID #" + lineID);
            isNew = false;
            actionsArray[i] = formInfo;
          }
        }
        if (isNew) {
          actionsArray.push(formInfo);
        }
        let actionsObject = { "actions": actionsArray };
        this.storage.set(this.GCPickupFormKey, actionsObject);
      }
    });
  }

  getDetailsPackingSlip(){
    this.warehouseCheckInService.getCheckInStatus(this.workOrder.WorkOrderSID).then(
      response => {
        if(response == true){
          this.warehouseCheckInService.getWciDetails(this.workOrder.WorkOrderSID).then(
            data => {
                this.gcName = data.CheckInName,
                this.gcEmail = data.CheckInEmail
            }, 
            error => {
              console.log(error);
            }
          )}     
      }
    )
  }
}
