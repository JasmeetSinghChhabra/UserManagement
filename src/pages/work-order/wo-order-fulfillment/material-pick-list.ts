import { Component } from '@angular/core';
import { LoadingController, NavParams, AlertController, ModalController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { BasePage } from '../../base.page';
import { WorkOrderModel, UserTypes, User, WorkOrderStatus, Modules } from '../../../models/models';
import { AppService, WorkOrderService, UserService, AuthService } from '../../../services/services';
import * as moment from 'moment';
import { PickedItem } from '../../../models/work-order/order-fulfillment';
import { AppConfig } from '../../../app/config/app.config';
import { Helper } from '../../../utils/utils';
import { Settings } from '../../../services/common/settings.service';
import { GcPickPage } from './gc-pick'
import { OFWOViewTypes } from '../../../models/work-order/work-order.model';
import { MaterialPicker } from './components/material-picker';
import { SerialNumberScanner } from './components/serial-number-scanner';
import { LotScanner } from './components/lot-scanner';
import { Printer, PrintOptions } from '@ionic-native/printer';

@Component({
  selector: 'page-material-pick-list',
  templateUrl: 'material-pick-list.html',
  providers: [WorkOrderService, BarcodeScanner, UserService, Printer]
})

export class MaterialPickList extends BasePage {

  workOrder: WorkOrderModel;
  workOrderDetail: any[] = [];
  selectedMaterial: PickedItem;
  lotsAndSerialNumbersScanned: Map<string, string[]> = new Map();
  minDockDate: String;
  maxDockDate: String;
  currentUser: User;
  shownGroup = null;
  isWOEditable: boolean;
  isPickEnabled: boolean;
  isPackEnabled: boolean;
  isWOAssignable: boolean;
  assigneeUsers: User[];
  kitLocationNumbers: any[];
  noData: boolean;
  parentPage: any;
  page: string;
  dupescan: boolean = false;
  priorityClass: string;
  enableScanTextField: boolean;
  toggleScanFieldText: string;
  viewType: number;
  gcPickUpTime;
  gcPickUpDate;
  isPackTab;
  isQCTab;
  isStagedLocationEnabled: boolean;
  soId: any;

  constructor(loadingCtrl: LoadingController,
    private navParams: NavParams,
    private barcodeScanner: BarcodeScanner,
    private printer: Printer,
    private workOrderService: WorkOrderService,
    private alertCtrl: AlertController,
    private userService: UserService,
    private auth: AuthService,
    private app: AppService,
    private modalCtrl: ModalController,
    private helper: Helper,
    private settings: Settings,
    private config: AppConfig) {
    super(loadingCtrl);
    this.workOrder = navParams.get('item');
    this.parentPage = navParams.get('parentPage');
    this.minDockDate = moment().format('YYYY-MM-DD');
    this.maxDockDate = moment().add(1, 'years').format('YYYY-MM-DD');
    this.viewType = navParams.get('viewType');
    this.page = this.viewType == OFWOViewTypes.GCPickupAssigned ? 'picked' : 'pending';
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
    this.gcPickUpDate = moment(this.workOrder.PickupDate).format("MM/DD/YYYY");
    this.gcPickUpTime = moment(this.workOrder.PickupDate).format("hh:mm a");
    this.priorityClass = this.getPriorityClass();
    this.isPackTab = this.viewType == OFWOViewTypes.GCPickupAssigned;
    this.isQCTab = this.viewType == OFWOViewTypes.QC;
    this.isStagedLocationEnabled = this.isQCTab
      || this.viewType == OFWOViewTypes.GCPickupAssigned

  }

  ngOnInit(): void {
    this.getWorkOrderDetail();

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

  toggleGroup(group) {
    if (this.isGroupShown(group)) {
      this.shownGroup = null;
    } else {
      this.shownGroup = group;
    }
  };

  isGroupShown(group) {
    return this.shownGroup === group;
  };

  updateScannerCopy() {
    this.toggleScanFieldText = "Use External Bluetooth Scanner";
    this.settings.setValue("enableScanTextField", this.enableScanTextField);
    this.settings.setValue("toggleScanFieldText", this.toggleScanFieldText);
    this.settings.save();
  }

  getWorkOrderDetail(refresher = null) {
    this.presentLoading("Loading Work Order detail...");
    //To test on web without connecting to API, uncomment below line and comment the next line
    //this.workOrderService.getStaticOFWorkOrderDetails().then(
    this.workOrderService.getOFWorkOrderDetails(this.workOrder.WorkOrderSID).then(
      response => {
        this.workOrderDetail = response;
        this.soId = response[0].Id;
        this.dismissLoading();

        this.isWOEditable = false;// editing is not needed for any fields that use this flag
        this.isPickEnabled = (this.workOrder.StatusSID == WorkOrderStatus.KitInProgress || this.workOrder.StatusSID == WorkOrderStatus.QCInProgress || this.workOrder.StatusSID == WorkOrderStatus.GCReview)
          && this.workOrder.AssignedUserSID == this.currentUser.UserSid
        this.isPackEnabled = this.workOrder.StatusSID == WorkOrderStatus.GCReview
          && this.workOrder.AssignedUserSID == this.currentUser.UserSid
          && this.isPackTab;
        this.isWOAssignable = false;//disable assigning from OF detail screen

        this.noData = !response || response.length == 0

        if (this.isWOAssignable) {
          this.getUsers();
        }

        if (this.workOrder.TypeSID == 11) {
          this.getKitLocationNumbers();
        }

        if (refresher) {
          refresher.complete();
        }
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Work Order detail. Please try again.");
      }
    );
  }

  doRefresh(refresher) {
    this.getWorkOrderDetail(refresher);
  }

  doPulling(refresher) {
    //console.log('Do Pulling...', refresher.progress);
  }

  getKitLocationNumbers(): void {
    this.presentLoading("Loading Kit Location #s...");
    this.workOrderService.getOFKitLocationNumbers().then(
      response => {
        this.dismissLoading();
        this.kitLocationNumbers = response;
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Kit Location #s. Please try again.");
      }
    );
  }

  getUsers(): void {
    this.presentLoading("Loading Assignee list...");
    this.userService.getUsersbyTypeAndPermissions(UserTypes.OFAssociate, Modules.WorkOrder).subscribe(
      response => {
        this.dismissLoading();
        this.assigneeUsers = response;
        this.assigneeUsers.push(this.currentUser);
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Assignee list. Please try again.");
      }
    );
  }

  itemTapped(event, item) {
    this.selectedMaterial = item;
    this.resetTransientData();
    if (this.dupescan) {
      this.dupescanLocation(item);
    }
    else {
      this.scanLocation(item);
    }
  }

  resetTransientData() {
    this.lotsAndSerialNumbersScanned = new Map();
  }

  canPickThis(material: any, page: string) {
    return page != 'picked'
      && this.hasAvailableQtyAtAnyLocation(material) && this.getPendingQty(material) > 0
  }

  hasAvailableQtyAtAnyLocation(material: any) {
    return material.InventoryItemLocations.find(detail => detail.LocationQty > 0);
  }

  getPendingQty(material: any) {
    return material.QtyOrdered - material.QtyPick;
  }

  getSerialLotDescription(pickListItem: any, location: any, page: string) {
    let text = "";
    if (page != 'picked') {
      if (pickListItem.ItemIsSerial) {
        if (location.SerialNumbers.length == 1) {
          text = location.SerialNumbers[0];
        }
        else if (location.SerialNumbers.length > 1) {
          text = 'Multiple';
        }
        if (pickListItem.ItemIsLot) {
          text += " / ";
        }
      }
      if (pickListItem.ItemIsLot) {
        text += location.LotNumber;
      }
    }
    else if (location.ScannedSerialNumbers) {
      location.ScannedSerialNumbers.forEach(
        serialNumber => text += serialNumber + (location.LotNumber ? " / " + location.LotNumber : "") + "\n"
      );
    }
    return text;
  }

  showPickQuantityInput(location: any, lotNumberScanned: string, selectedLots: any[]) {
    let modal = this.modalCtrl.create(MaterialPicker, { pickedItem: this.selectedMaterial, pickedLocation: location, lotNumber: lotNumberScanned });
    modal.onDidDismiss(data => {
      if (data && data.action == 'confirm') {
        this.performSystemPick(parseFloat(data.pickedQty), new Map(), lotNumberScanned, data.pickedLocation, selectedLots);
      }
      this.resetTransientData();
    });
    modal.present({
      keyboardClose: false
    });
  }

  showSerialNumberScanPrompt(validationMessage: string, selectedLots: any[]) {

    let modal = this.modalCtrl.create(SerialNumberScanner, {
      pickedItem: this.selectedMaterial, pickedLocationId: selectedLots[0].LocationId,
      lotsAndSerialNumbers: this.lotsAndSerialNumbersScanned, validationMessage: validationMessage
    });

    modal.onDidDismiss(data => {
      this.settings.load().then(() => {
        this.enableScanTextField = this.settings.allSettings["enableScanTextField"];
        this.toggleScanFieldText = this.settings.allSettings["toggleScanFieldText"];
      });

      if (data) {
        let selectedLots = this.selectedMaterial.InventoryItemLocations.filter(detail => detail.LocationId.toUpperCase() === data.pickedLocationId.toUpperCase());
        if (data.action == 'scan') {
          if (this.dupescan) {
            this.dupescanSerialNumber(selectedLots);
          }
          else {
            this.scanSerialNumber(selectedLots);
          }
        }
        else if (data.action == 'readText') {
          this.processSerialNumberScan({ "text": data.serialNumber }, selectedLots);
        }
        else if (data.action == 'done') {
          let pickedLocation = this.getSummarizedLocationFromLots(selectedLots);
          this.performSystemPick(this.getScannedSerialNumberCount(), new Map(this.lotsAndSerialNumbersScanned), "", pickedLocation, selectedLots);
        }
      }
      else {
        this.resetTransientData();
      }
    });
    modal.present({
      keyboardClose: false
    });
  }

  showLotNumberScanPrompt(validationMessage: string, selectedLots: any[]) {
    let modal = this.modalCtrl.create(LotScanner, {
      pickedItem: this.selectedMaterial, pickedLocationId: selectedLots[0].LocationId
      , validationMessage: validationMessage
    });
    modal.onDidDismiss(data => {
      this.settings.load().then(() => {
        this.enableScanTextField = this.settings.allSettings["enableScanTextField"];
        this.toggleScanFieldText = this.settings.allSettings["toggleScanFieldText"];
      });

      if (data) {
        let selectedLots = this.selectedMaterial.InventoryItemLocations.filter(detail => detail.LocationId.toUpperCase() === data.pickedLocationId.toUpperCase());
        if (data.action == 'scan') {
          if (this.dupescan) {
            this.dupescanLot(selectedLots);
          }
          else {
            this.scanLot(selectedLots);
          }
        }
        else if (data.action == 'readText') {
          this.processLotScan({ "text": data.lotNumber }, selectedLots);
        }
      }
      else {
        this.resetTransientData();
      }
    });
    modal.present();
  }

  showPartialPickMessage() {
    let alert = this.alertCtrl.create({
      title: "Complete Work Order",
      message: "There are items pending to be picked. Are you sure you want to complete this Work Order?",
      buttons: [
        {
          text: 'Yes',
          handler: data => {
            this.workOrder.StatusSID = WorkOrderStatus.Completed;
            this.saveWorkOrderAndGoToPreviousPage();
          }
        },
        {
          text: "No",
          role: 'cancel',
          handler: data => {
            console.log('No clicked');
          }
        }
      ]
    });
    alert.present();
  }

  getSummarizedLocationFromLots(lots: any[]) {
    let location = {
      Id: lots[0].Id,
      LocationId: lots[0].LocationId,
      LocationQty: 0
    }
    lots.forEach(lot => location.LocationQty += lot.LocationQty);
    return location;
  }

  filterHeadersOfType(type) {
    if (type == 'all') {
      return this.workOrderDetail;
    }
    else if (type == 'picked') {
      return this.workOrderDetail.filter((element) => element.SoLines.some((subElement) => subElement.QtyPick > 0));
    }
    else {
      return this.getPendingSOs();
    }
  }

  filterLinesOfType(SoLines, page) {
    if (page == 'all') {
      return SoLines;
    }
    else if (page == 'picked') {
      return SoLines.filter(element => element.QtyPick > 0);
    }
    else {
      return SoLines.filter(element => (element.QtyOrdered - element.QtyPick) > 0);
    }
  }

  compareLineLoc = function compare(a, b) {

    let compareLoc = function compare(a, b) {
      if (a.LocationId < b.LocationId)
        return -1;
      if (a.LocationId > b.LocationId)
        return 1;
      return 0;
    }

    if (a.InventoryItemLocations.length == 0)
      return 1;

    if (b.InventoryItemLocations.length == 0)
      return -1;

    let minLocationA = a.InventoryItemLocations.sort(compareLoc)[0];
    let minLocationB = b.InventoryItemLocations.sort(compareLoc)[0];

    if (minLocationA.LocationId < minLocationB.LocationId)
      return -1;
    if (minLocationA.LocationId > minLocationB.LocationId)
      return 1;
    return 0;

  }

  filterLocationsOfType(pickListItem: any, page) {
    if (page != 'picked') {
      return pickListItem.InventoryItemLocations;
    }
    else {
      return pickListItem.InventoryItemLocations.filter(element => element.QtyPick > 0);
    }
  }

  getPendingSOs() {
    return this.workOrderDetail.filter((element) =>
      element.SoLines.some((subElement) => (subElement.QtyOrdered - subElement.QtyPick) > 0));
  }

  filterAvailableLocations(locationAvailability) {
    return locationAvailability.filter(item => item.LocationQty > 0 || item.QtyPick > 0);
  }

  dupescanLocation(selectedMaterial: any) {
    let barcodeData = { "text": "D003" };
    this.processLocationScan(barcodeData);
  }

  dupescanSerialNumber(selectedLots: any[]) {
    let barcodeData = { "text": "ATT08644387" };
    if (this.lotsAndSerialNumbersScanned.size > 0) {
      barcodeData = { "text": "text" };
    }
    this.processSerialNumberScan(barcodeData, selectedLots);
  }

  dupescanLot(selectedLots: any[]) {
    let barcodeData = { "text": "110 feet" };
    this.processLotScan(barcodeData, selectedLots);
  }

  completeWorkOrder() {
    if (this.getPendingSOs().length > 0) {
      this.showPartialPickMessage();
    }
    else {
      this.workOrder.StatusSID = WorkOrderStatus.Shipped;
      this.saveWorkOrderAndGoToPreviousPage();
    }
  }

  assignWorkOrder() {
    this.workOrder.StatusSID = WorkOrderStatus.KitInProgress;
    this.saveWorkOrderAndGoToPreviousPage();
  }

  qcComplete() {
    if (!this.workOrder.StagedLocation) {
      let alert = this.alertCtrl.create({
        title: "Incomplete Work Order",
        message: "Staged Location # is blank. Please enter a Staged Location # before continuing."
      });
      alert.addButton('Ok');
      alert.present();
    }
    else {
      this.workOrder.StatusSID = WorkOrderStatus.QCApproved;
      this.workOrder.AssignedUserSID = null;
      this.saveWorkOrderAndGoToPreviousPage();
    }
  }

  saveWorkOrder(): void {
    this.presentLoading("Saving Work Order...");
    this.workOrderService.saveWorkOrder(this.workOrder).then(
      workOrder => {
        this.app.showToast("Work Order saved successfully!", "success");
        this.dismissLoading();
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while saving Work Order. Please try again.");
      }
    );
  }

  saveWorkOrderAndGoToPreviousPage(): void {
    this.presentLoading("Saving Work Order...");
    this.workOrderService.saveWorkOrder(this.workOrder).then(
      workOrder => {
        this.app.showToast("Work Order saved successfully!", "success");
        this.dismissLoading();
        this.parentPage.doRefresh(null);
        this.app.navCtrl.pop();
      },
      error => {
        this.dismissLoading();
        console.error(error);
        this.app.showErrorToast("An error occurred while saving Work Order. Please try again.");
      }
    );
  }

  getScannedSerialNumberCount() {
    let count: number = 0;
    this.lotsAndSerialNumbersScanned.forEach((value: string[], key: string) => {
      count += value.length;
    });
    return count;
  }

  getSerialNumberAsArray(lotsAndSerialNumbers: Map<string, string[]>) {
    let serialNumbers = [];
    lotsAndSerialNumbers.forEach((value: string[], key: string) => {
      serialNumbers.push(...value);
    });
    return serialNumbers;
  }

  processLocationTextEntry(material) {
    this.selectedMaterial = material;
    this.resetTransientData();
    this.processLocationSelection(material.binNumber);
  }

  processLocationExternalScan(material) {
    if (!this.app.isiOS()) {
      this.processLocationTextEntry(material);
    }
  }

  processLocationClick(locationId, material) {
    this.selectedMaterial = material;
    this.resetTransientData();
    this.processLocationSelection(locationId);
  }

  processLocationScan(barcodeData: any) {
    this.processLocationSelection(barcodeData.text);
  }

  processLocationSelection(locationId: any) {
    if (locationId) {
      let selectedLots = this.selectedMaterial.InventoryItemLocations.filter(detail => detail.LocationId.toUpperCase() === locationId.toUpperCase());
      if (selectedLots.length > 0) {
        if (this.selectedMaterial.ItemIsSerial) {
          this.showSerialNumberScanPrompt(null, selectedLots);
        }
        else if (this.selectedMaterial.ItemIsLot) {
          this.showLotNumberScanPrompt(null, selectedLots);
        }
        else {
          let selectedLocation = selectedLots[0]; // there should be only one lot in this case
          if (selectedLocation.LocationQty > 0) {
            this.showPickQuantityInput(selectedLocation, null, selectedLots);
          }
          else {
            this.app.showAlert("Location fully picked", "Item is not available any more in the inventory");
          }
        }
      } else {
        this.app.showAlert("Location not found",
          "Scanned location does not match with location of material trying to pick. Please try to scan correct location!");
      }
    }
    else {
      this.app.showAlert("Location not found",
        "Please enter a Location Id and try again!");
    }
  }

  processSerialNumberScan(barcodeData: any, selectedLots: any[]) {
    if (barcodeData.text) {
      let selectedLocation = selectedLots.find(detail => detail.SerialNumbers.some(serialNumber => serialNumber.toUpperCase() == barcodeData.text.toUpperCase()));
      if (selectedLocation) {
        let serialNumbersAtLot = this.lotsAndSerialNumbersScanned.get(selectedLocation.LotNumber);
        if (!serialNumbersAtLot) {
          serialNumbersAtLot = [];
          this.lotsAndSerialNumbersScanned.set(selectedLocation.LotNumber, serialNumbersAtLot);
        }
        if (serialNumbersAtLot.indexOf(barcodeData.text) > -1) {
          this.showSerialNumberScanPrompt("This serial number has already been scanned. Please scan another serial number!", selectedLots);
        }
        else {
          serialNumbersAtLot.push(barcodeData.text);
          this.showSerialNumberScanPrompt(null, selectedLots);
        }
      }
      else {
        this.showSerialNumberScanPrompt("Scanned serial number does not match with serial number of material trying to pick. Please try to scan correct serial number!",
          selectedLots);
      }
    }
    else {
      this.showSerialNumberScanPrompt("Please enter a Serial number and try again!", selectedLots);
    }
  }

  processLotScan(barcodeData: any, selectedLots: any[]) {
    if (barcodeData.text) {
      let selectedLocation = selectedLots.find(detail => detail.LotNumber.toUpperCase() === barcodeData.text.toUpperCase());
      if (selectedLocation) {
        this.showPickQuantityInput(selectedLocation, barcodeData.text, selectedLots);
      }
      else {
        this.showLotNumberScanPrompt("Scanned lot number does not match with lot number of material trying to pick. Please try to scan correct lot number!",
          selectedLots);
      }
    }
    else {
      this.showLotNumberScanPrompt("Please enter a Lot number and try again!", selectedLots);
    }
  }

  scanLocation(selectedMaterial: any) {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.processLocationScan(barcodeData);
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing barcode scanner. Please try again.");
    });
  }

  scanSerialNumber(selectedLots: any[]) {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.processSerialNumberScan(barcodeData, selectedLots);
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing barcode scanner. Please try again.");
    });
  }

  scanLot(selectedLots: any[]) {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.processLotScan(barcodeData, selectedLots);
    }, (err) => {
      this.app.showErrorToast("An error occurred while accessing barcode scanner. Please try again.");
    });
  }

  adjustQuantities(quantity: number, location: any, lotsAndSerialNumbers: Map<string, string[]>, selectedLots: any[]) {
    this.selectedMaterial.QtyPick = this.selectedMaterial.QtyPick + quantity;
    location.LocationQty = location.LocationQty - quantity;
    location.QtyPick = (location.QtyPick ? parseFloat(location.QtyPick) : 0) + quantity;
    lotsAndSerialNumbers.forEach((value: string[], key: string) => {
      let lot = selectedLots.find(detail => detail.LotNumber === key);
      if (lot) {
        lot.LocationQty = lot.LocationQty - quantity;
        lot.QtyPick = (lot.QtyPick ? parseFloat(lot.QtyPick) : 0) + quantity;
        lot.ScannedSerialNumbers = value;
      }
    });
  }

  getPriorityClass() {
    if (this.workOrder.PriorityDescription) {
      return 'status-' + this.helper.camelToDash(this.workOrder.PriorityDescription);
    } else {
      return 'status-no-priority';
    }
  }

  setPriorityClass(event: any) {
    console.log(event);

    switch (+event) {
      case 1:
        console.log('status-critical');
        this.priorityClass = 'status-critical';
        break;
      case 2:
        console.log('status-high');
        this.priorityClass = 'status-high';
        break
      case 3:
        console.log('status-medium');
        this.priorityClass = 'status-medium';
        break
      case 4:
        console.log('status-low');
        this.priorityClass = 'status-low';
        break
    }
  }

  performSystemPick(quantity: number, lotsAndSerialNumbers: Map<string, string[]>, lotNumber: string, location: any, selectedLots: any[]) {
    let pickListItem = {
      SoLineId: this.selectedMaterial.Id,
      ItemSerial: this.getSerialNumberAsArray(lotsAndSerialNumbers).toString().replace(/,/g, ';'),
      InvLocId: location.Id,
      ItemLot: lotNumber,
      LocNumber: location.LocationNumber,
      Qty: quantity,
      WorkOrderNumber: this.workOrder.WorkOrderSID
    };

    this.presentLoading("Performing pick operation...");
    this.workOrderService.pickOFWorkOrderItem(pickListItem).then(
      pickListItem => {
        this.adjustQuantities(quantity, location, lotsAndSerialNumbers, selectedLots);
        this.app.showToast("Pick operation completed successfully.", "success");
        this.dismissLoading();
      },
      error => {
        this.dismissLoading();
        console.error(error);

        // We only handle these two specific errors differently because we cannot grab the inventory balance in real time.
        if(JSON.stringify(error).includes("no qualifying inventory locations were found") 
        || JSON.stringify(error).includes("A qualifying Inventory Item Location not found for the specified Loc ID, Loc No and Lot No")){
          this.app.showErrorToast("There is an update in inventory available at that location. Please refresh Work Order and try again.");
        } else {
          this.app.showErrorToast("An error occurred while performing pick operation. Please try again.");
        }        
      }
    );
  }

  gcPick() {
    if (!this.workOrder.LocationNumber) {
      let alert = this.alertCtrl.create({
        title: "Incomplete Work Order",
        message: "Kit Location # is blank. Please select a Kit Location # before continuing."
      });
      alert.addButton('Ok');
      alert.present();
    }
    else if (!this.workOrder.StagedLocation) {
      let alert = this.alertCtrl.create({
        title: "Incomplete Work Order",
        message: "Staged Location # is blank. Please enter a Staged Location # before continuing."
      });
      alert.addButton('Ok');
      alert.present();
    }
    else {
      this.app.navCtrl.push(GcPickPage, {
        soLines: this.workOrderDetail,
        workOrder: this.workOrder,
        soId: this.soId,
        isPickPending: this.getPendingSOs().length > 0
      });
    }
  }

  pickComplete() {

    if (!this.workOrder.LocationNumber) {
      let alert = this.alertCtrl.create({
        title: "Incomplete Work Order",
        message: "Kit Location # is blank. Please select a Kit Location # before continuing."
      });
      alert.addButton('Ok');
      alert.present();
    }

    else if (this.getPendingSOs().length > 0) {
      let alert = this.alertCtrl.create({
        title: "Pick Complete",
        message: "There are items pending to be picked.<br><br>Enter how many printed copies are needed if you wish to continue.",
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
              this.sendPrintouts(WorkOrderStatus.PartiallyPicked, data.printQuantity);
            }              
          }
          else {
            alert.setMessage("Not a valid print quantity!!");
            let newAlert = this.alertCtrl.create({
              title: "Invalid Input",
              message: "Invalid number of copies! Please try again."
            });
            newAlert.addButton({
              text: "Ok",
              handler: () => {
                this.pickComplete();
              }
            })
            newAlert.present();
          }
        }
      });
      alert.addButton('Cancel');
      alert.present();
    }

    else {
      let alert = this.alertCtrl.create({
        title: "Pick Complete",
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
              this.sendPrintouts(WorkOrderStatus.FullyPicked, data.printQuantity);
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
                this.pickComplete();
              }
            })
            newAlert.present();
          }
        }
      });
      alert.addButton('Cancel');
      alert.present();
    }
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

  sendPrintouts(status: WorkOrderStatus, printQuantity: number) {

    let pageIndexSize = "50px";
    let labelSize = "75px";
    let valueSize = "85px";
    let maxChars = 10;

    let thisGC = this.workOrder.GCCompanyDescription;
    if ((thisGC == null) || (thisGC == "")) {
      thisGC = "TBD";
    }
    else {
      let lastCharPos = thisGC.lastIndexOf("(");
      if (lastCharPos != -1) {
        thisGC = thisGC.substr(0, lastCharPos).trim();
      }
    }

    let imageURL = this.config.endpoint + "/Content/Nexius_Logo_Grey_Orange.png";

    let messageDetails = "<html><body>";

    messageDetails += '<style type="text/css"> html, body { height: calc(100%-10px); width: calc(100%-10px); padding: 0px; margin:0px} div { padding: 0px; margin: 0px;}';

    if (printQuantity > 1) {
      messageDetails += '.labelBodyPageBreak { transform:scale(0.9); height: calc(100%-10px); width: calc(100%-10px);page-break-before: always;}';
      messageDetails += '.labelBody { transform:scale(0.9); height: calc(100%-10px);width: calc(100%-10px);}';
    }

    messageDetails += '</style>';
    
    for (let i = 0; i < printQuantity; i++) {
      if(i>0){
        messageDetails += "<div class='labelBodyPageBreak'>";
      }
      else{
        messageDetails += "<div class='labelBody'>";
      }
      
      messageDetails += "<table border=0 width='100%'>";
      messageDetails += "<tr><td><img src='" + imageURL + "' style='width: 265px; margin-bottom: 20px;'></td>";
      messageDetails += "<td style='padding: 1px; text-align: right; font-family: Times New Roman; font-size: " + pageIndexSize + ";'>" + (i + 1) + " of " + printQuantity + "</td><tr></table>";

      messageDetails += "<table border=1 width='100%'>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>Site</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.truncateString(this.workOrder.SiteId, maxChars) + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>PTN</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.truncateString(this.workOrder.SitePtn, maxChars) + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>GC</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.truncateString(thisGC, maxChars) + "</td></tr>";
      messageDetails += "<tr><td style='padding: 1px; text-align: left; font-family: Times New Roman; font-size: " + labelSize + ";'>WO&nbsp;#</td>";
      messageDetails += "<td style='text-align: center; font-family: Times New Roman; font-size: " + valueSize + ";'>" + this.truncateString(this.workOrder.WorkOrderSID.toString(), maxChars) + "</td></tr>";
      messageDetails += "</table>";
      messageDetails += "</div>";

    }
    messageDetails += "</body></html>";

    let printOptions: PrintOptions = {
      name: "AccuV_WO_OF_" + this.workOrder.WorkOrderSID,
      landscape: true,
      duplex: true
    };

    let printer = this.printer;
    printer.check().then(
      printerInfo => {
        printer.print(messageDetails, printOptions).then(
          printed => {
            if (printed) {
                this.completePickupCall(status);
                this.app.showSuccessToast("Print Job complete!");
            }
            else {
              this.showTryPrintAgainConfirmation("Printing was canceled. Do you want to try again?", status, printQuantity);
            }
          },
          error => {
            this.showTryPrintAgainConfirmation("Printing failed. Do you want to try again?", status, printQuantity);
          }
        );
      },
    );
  }

  showTryPrintAgainConfirmation(message: string, status: WorkOrderStatus, printQuantity: number) {
    let alert = this.alertCtrl.create({
      title: "Attention",
      message: message,
    });
    alert.addButton({
      text: 'Yes',
      handler: () => {
        this.sendPrintouts(status, printQuantity);
      }
    });
    alert.addButton({
      text: 'No',
      handler: () => {
        this.completePickupCall(status);
        this.app.dismissLoading();
        console.log("Print Again response = No");
        this.app.navCtrl.pop();
      }
    });
    alert.present();
  }

  completePickupCall(status: number) {
    this.app.presentLoading();
    this.workOrderService.completePickup(this.workOrder, status).then(
      () => {
        this.app.dismissLoading();
        console.log("PickUp Complete!");
        this.app.navCtrl.pop();
      },
      error => {
        this.app.dismissLoading();
        this.app.navCtrl.pop();
        this.app.showErrorToast("An error occurred when trying to complete pickup!")
      }
    );
  }

}
