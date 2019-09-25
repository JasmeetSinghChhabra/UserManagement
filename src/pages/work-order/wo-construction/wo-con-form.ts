import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, Searchbar, AlertController, ModalController, Platform } from 'ionic-angular';
import { BasePage } from '../../base.page';
import { AppService, AuthService, WorkOrderService, GeoService, FileService } from '../../../services/services';
import { WorkOrderModel, DocumentModel, WorkOrderStatus, Modules } from '../../../models/models';
import { Helper } from '../../../utils/utils';
import { SelectSearchable } from '../../../components/select-searchable/select-searchable';
import { DocumentLibrary } from '../../../components/document-library/document-library';

import * as moment from 'moment';
import * as mime from 'mime';
import { WorkOrderCheckIn, WorkOrderCheckInUDF, WorkOrderType, WorkOrderTypes } from '../../../models/work-order/work-order.model';
import { CheckInForm } from './components/checkin-form';
import { VideoChatComponent } from '../../../components/video-chat/video-chat';
import { VideoQaChecklistPage } from '../../video-qa/video-qa-checklist';
import { VideoQaSectorsPage } from '../../video-qa/video-qa-sectors';
import { VQAItem, VQAStatus, VQAStatusBE } from '../../../models/video-qa/vqa.model';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { ProgramFeatures } from '../models/common/features.model';

//@IonicPage()
@Component({
  selector: 'wo-con-form',
  templateUrl: 'wo-con-form.html',
  providers: [WorkOrderService, FileService]
})
export class WorkOrderCONForm extends BasePage {
  @ViewChild('workOrderForm') workOrderForm: NgForm;
  @ViewChild('map') mapElement: ElementRef;
  @ViewChild(Searchbar) searchbar: Searchbar;
  map: any;
  mapEl: any;
  model: WorkOrderModel;
  page: string;
  Documents: DocumentModel[];
  DocumentsOriginal: DocumentModel[];
  CheckInHistory: WorkOrderCheckIn[];
  LastCheckIn: WorkOrderCheckIn;
  changeStatusButton: string;
  toggled: boolean = false;
  shownGroup = null;
  searchTerm: string = '';
  addressReady: boolean = false;
  addressError: string = "Site address is not available";
  isCheckinEditable: boolean;
  workOrderCheckinUDFLovs: any[];
  fieldServiceManagementUDFLovs: any[];
  fsmLogs: any[];
  nextPage: string;
  VQAEquipmentTypes: VQAItem[];
  VQAEquipmentTypesFiltered:  VQAItem[];
  filteringVQA: number = -1;
  
  START_ACTION: string = "start";
  STOP_ACTION: string = "stop";

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private auth: AuthService,
    private workOrderService: WorkOrderService, private app: AppService, public geo: GeoService,
    private alertCtrl: AlertController, private modalCtrl: ModalController, private helper: Helper,
    private fileService: FileService, private androidPermissions: AndroidPermissions,
    private locationAccuracy: LocationAccuracy) {
    super(loadingCtrl);

    this.page = "form";
    this.nextPage = navParams.get("page");
    this.model = navParams.get('item');
    this.isCheckinEditable = auth.userInfo.IsUserGC;

    this.fieldServiceManagementUDFLovs = [];
    this.fsmLogs = [];
  }

  ngOnInit(): void {
      this.getWorkOrder();
      this.getDocuments();
      this.getCheckInHistory();
      this.getWorkOrderCheckinUDFLovs();
     this.getFieldServiceManagementUDFLovs();
    this.getVideoChecklist();
  }

  ngAfterViewInit(): void {
    this.mapEl = this.mapElement.nativeElement;

  }

  ngAfterViewChecked(){
    if(!this.helper.isNullOrUndefinedOrEmpty(this.nextPage)) this.page =  this.nextPage;
    this.nextPage = null;
  }

  ionViewWillEnter(){
    if (this.VQAEquipmentTypes){
      this.calculateVQAStats();
      this.VQAEquipmentTypesFiltered = JSON.parse(JSON.stringify(this.VQAEquipmentTypes)) as VQAItem[];
      this.reFilterGroups();
    }
  }

  getWorkOrder(): void {
    this.workOrderService.getWorkOrder(this.model.SiteNumber).then(
      wo => {
        this.model.latitude = wo.latitude;
        this.model.longitude = wo.longitude;
        this.loadMap();
      },
      error => {
        console.error(error);
      }
    );
  }

  getInfoForCall(){
    if (this.model.FieldServiceEngineer){
      const alert = this.alertCtrl.create({
        title: `AccuV Video Call`,
        message: `Are you sure, you want to call ` + this.model.FieldServiceEngineerName + `?`,
        buttons: [
          {
            text: 'Cancel'
          },
          {
            text: 'Call',
            handler: data => {
              console.log(`Calling`);
              let modalVideoChat = this.modalCtrl.create(VideoChatComponent, { moduleId: Modules.WorkOrder, calleeId : this.model.FieldServiceEngineer, woSID: this.model.WorkOrderSID});
                modalVideoChat.present();
            }
          }
        ]
      });
      alert.present();
    } else {
      const alert = this.alertCtrl.create({
        title: `AccuV Video Call`,
        message: `There's no field service engineer assigned to this Work Order currently.`,
        buttons: [
          {
            text: 'Ok'
          }
        ]
      });
  
      alert.present();
    }
   
  }


  getWorkOrderCheckinUDFLovs() {
    this.workOrderService.GetWorkOrderCheckinUDFLovs().then(
      data => {
        this.workOrderCheckinUDFLovs = data;
      },
      error => {
        console.error(error);
      }
    );
  }

  getLogsAndNotes(checkinSIDs: number[]){
    this.workOrderService.GetLogsAndNotes(checkinSIDs.join(',')).then(
      data => {
        this.fsmLogs = this.fsmLogs.concat(data);
      },
      error => {
        console.error(error);
      }
    );
  }

  getFieldServiceManagementUDFLovs(){
    this.workOrderService.GetFieldServiceManagementUDFLovs(this.model.WorkOrderSID, this.model.TypeSID).then(
      data => {
        this.fieldServiceManagementUDFLovs = data.sort((a, b) => a.DisplayOrder <= b.DisplayOrder ? -1 : 1);
        data.forEach(element => {
          if (element.UDFValue != ""){
            element.UDFValue = JSON.parse(element.UDFValue);
          }
        });
      },
      error => {
        console.error(error);
      }
    );
  }

  getLovDescription(lovId: string): string {
    let lovDescription = "";
      if (this.workOrderCheckinUDFLovs != null) {
      let lov = this.workOrderCheckinUDFLovs.find(lov => lov.LovId == lovId);
      if (lov != null)
        lovDescription = lov.LovDescription;
    }
    return lovDescription;
  }

  getVideoChecklist() {
    this.workOrderService.GetVideoChecklistActions(this.model.WorkOrderSID, this.model.TypeSID).then(
      data => {
        let list:VQAItem[] = data as VQAItem[];
        this.VQAEquipmentTypes = JSON.parse(JSON.stringify(list)) as VQAItem[];
        this.calculateVQAStats();
        this.VQAEquipmentTypesFiltered = JSON.parse(JSON.stringify(this.VQAEquipmentTypes)) as VQAItem[];
      },
      error => {
        console.error(error);
      }
    );
  }

  calculateVQAStats(){
    this.VQAEquipmentTypes.forEach(equipmentType => {
      this.clearStats(equipmentType);
      equipmentType.Childs.forEach(sectors => {
        if (sectors.Childs && sectors.Childs.length > 0){
          sectors.Childs.forEach(positions => {
            if (positions.Childs && positions.Childs.length > 0){
              positions.Childs.forEach(position => {
                //4 levels
                this.addVQAItemsToTotal(equipmentType, position);
              });
            } else {
              //3 levels
              this.addVQAItemsToTotal(equipmentType, positions);
            }
          });
        } else {
          //2 levels
          this.addVQAItemsToTotal(equipmentType, sectors);
        }
      });
    });
  }

  clearStats(vQAItem: VQAItem){
    vQAItem.TotalItems = 0;
    vQAItem.ApprovedItems = 0;
    vQAItem.RejectedItems = 0;
    vQAItem.UploadedItems = 0;
    vQAItem.PendingItems = 0;
  }

  addVQAItemsToTotal(equipmentType: VQAItem, element: VQAItem){
    equipmentType.TotalItems++;
    switch(element.Status){
      case VQAStatusBE.Approved:
      equipmentType.ApprovedItems++;
      break;
      case VQAStatusBE.Rejected:
      equipmentType.RejectedItems++;
      break;
      case VQAStatusBE.Uploaded:
      equipmentType.UploadedItems++;
      break;
      case VQAStatusBE.Pending:
      equipmentType.PendingItems++;
      break;
    }

    if (!element.Status){
      equipmentType.PendingItems++;
    }
  }

  filterGroups(index){
    if (this.VQAEquipmentTypes){
      this.VQAEquipmentTypesFiltered = JSON.parse(JSON.stringify(this.VQAEquipmentTypes)) as VQAItem[];
    }
    if (this.filteringVQA == index){
      console.log("Removed filter!");
      this.filteringVQA = -1;
    } else {
      console.log("Filtering...");
      this.matchFilter(index);
      this.filteringVQA = index;
    }
  }

  reFilterGroups(){
    if (this.filteringVQA != -1 ){
      console.log("Filtering...");
      this.matchFilter(this.filteringVQA);
    }
  }

  matchFilter(status){
    if (this.VQAEquipmentTypesFiltered){
      let filteredListAux: VQAItem[] = JSON.parse(JSON.stringify(this.VQAEquipmentTypesFiltered));
      this.VQAEquipmentTypesFiltered.forEach(equipmentType => {
        switch(status){
          case VQAStatus.Pending:
            this.statusFilter(equipmentType, filteredListAux, equipmentType.PendingItems);
          break;
          case VQAStatus.Approved:
            this.statusFilter(equipmentType, filteredListAux, equipmentType.ApprovedItems); 
          break;
          case VQAStatus.Rejected:
            this.statusFilter(equipmentType, filteredListAux, equipmentType.RejectedItems);
          break;
          case VQAStatus.Uploaded:
            this.statusFilter(equipmentType, filteredListAux, equipmentType.UploadedItems);
          break;
        } 
      });

      this.VQAEquipmentTypesFiltered = JSON.parse(JSON.stringify(filteredListAux));
    }
  }

  getItemsAmountByStatus(equipmentType: VQAItem){
    switch(this.filteringVQA){
      case VQAStatus.Pending:
      return equipmentType.PendingItems;
      case VQAStatus.Approved:
      return equipmentType.ApprovedItems;
      case VQAStatus.Rejected:
      return equipmentType.RejectedItems;
      case VQAStatus.Uploaded:
      return equipmentType.UploadedItems;
      case -1:
      return equipmentType.TotalItems;
    } 
  }

  statusFilter(equipmentType: VQAItem, filteredListAux: VQAItem[], statusAmount: number){
    if (statusAmount == 0){
      filteredListAux.splice(filteredListAux.indexOf(this.getEquipmentTypeAux(filteredListAux, equipmentType)), 1);
    } else {
      let equipmentTypeAux = this.getEquipmentTypeAux(filteredListAux, equipmentType);
      this.iterateItemAndFilter(status, equipmentTypeAux);
    }
  }

  getEquipmentTypeAux(filteredListAux: VQAItem[], equipmentType: VQAItem): VQAItem{
    return filteredListAux.filter(element => element.Name == equipmentType.Name )[0];
  }

  iterateItemAndFilter(status, equipmentType: VQAItem) {
    if (equipmentType.Childs && equipmentType.Childs.length > 0){
      equipmentType.Childs.forEach(sectors => {
        if (sectors.Childs && sectors.Childs.length > 0){
          sectors.Childs.forEach(position => {
            if (position.Childs && position.Childs.length > 0){
              position.Childs.forEach(item => {
                if (this.isDifferentToFilter(item.Status, status)){
                  this.cleanItemForFilter(position, item);
                }
              });
              if (position.Childs.length == 0){
                sectors.Childs.splice(sectors.Childs.indexOf(position), 1);
              } 
            } else {
              if (this.isDifferentToFilter(position.Status, status)){
                this.cleanItemForFilter(sectors, position);
              }
            }
          });
          if (sectors.Childs.length == 0){
            equipmentType.Childs.splice(equipmentType.Childs.indexOf(sectors), 1);
          } 
        } else {
          if (this.isDifferentToFilter(sectors.Status, status)){
            this.cleanItemForFilter(equipmentType, sectors);
          }
        }
      });
      if (equipmentType.Childs.length == 0){
        this.VQAEquipmentTypesFiltered.splice(this.VQAEquipmentTypesFiltered.indexOf(equipmentType), 1);
      }
    }
  }

  cleanItemForFilter(parentItem: VQAItem, item: VQAItem){
    let index = parentItem.Childs.indexOf(item);
    parentItem.Childs.splice(index, 1);
  }

  isDifferentToFilter(itemStatus: string, filterStatus: number): boolean{
    switch(filterStatus){
      case VQAStatus.Pending:
        return itemStatus != VQAStatusBE.Pending && itemStatus != null;
      case VQAStatus.Approved:
        return itemStatus != VQAStatusBE.Approved;
      case VQAStatus.Rejected:
        return itemStatus != VQAStatusBE.Rejected;
      case VQAStatus.Uploaded:
        return itemStatus != VQAStatusBE.Uploaded;
    }
  }

  getEquipmentTypeProgress(equipmentType){
    return ((equipmentType.ApprovedItems / equipmentType.TotalItems) * 100);
  }

  getFilterIconName(index){
    if (index == this.filteringVQA){
      return "check-square-o";
    } else {
      return "square-o";
    }
  }

  openChecklist(equipmentTypeFiltered: VQAItem){
    let equipmentType = this.VQAEquipmentTypes.filter(a => a.Name == equipmentTypeFiltered.Name)[0]; 
    if (equipmentType.Childs && equipmentType.Childs.length > 0
    && equipmentType.Childs[0].Childs && equipmentType.Childs[0].Childs.length > 0){
      this.app.navCtrl.push(VideoQaSectorsPage, {
        equipmentType: equipmentType,
        woSID: this.model.WorkOrderSID,
        woType: this.model.TypeSID
      });
    } else {
      this.app.navCtrl.push(VideoQaChecklistPage, {
        checklist: equipmentType.Childs,
        title: equipmentType.Name,
        equipmentType: equipmentType,
        woSID: this.model.WorkOrderSID,
        woType: this.model.TypeSID
      });
    }
  }

  getStatus(): string {
    this.changeStatusButton = "Start";
    if (this.model.StatusSID == WorkOrderStatus.Issued) {
      this.changeStatusButton = "Start";
    }
    if (this.model.StatusSID == WorkOrderStatus.InProgress) {
      this.changeStatusButton = "Complete";
    }
    return this.helper.camelToRegular(WorkOrderStatus[this.model.StatusSID]);
  }

  getChangeStatusButtonStyle(){
    if (this.changeStatusButton == "Start"){
      return "start-button";
    } else if (this.model.IsCheckedIn && this.model.StatusSID == WorkOrderStatus.InProgress){
      return "disabled";
    } else {
      return "disabled";
    }
  }

  getChangeStatusIcon(){
    if (this.changeStatusButton == "Start"){
      return "md-play";
    }  else {
      return "md-checkmark";
    }
  }

  getStatusClass(): string {
    return "status-" + this.helper.camelToDash(WorkOrderStatus[( this.helper.isNullOrUndefinedOrEmpty(this.model.StatusSID) == true ? "" : this.model.StatusSID)]);
  }

  getImagePath(fileName: string): string {
    return this.app.config.apiEndpoint + `/WorkOrder/GetCheckInFile/?fileName=${fileName}&projectId=${this.app.projectId}`;
  }

  isAddressReady() {
    return this.addressReady;
  }

  checkIn() {
    if (this.isUIComponentProgramAccepted()){
      this.showCheckInForm(true);
    } else {
      var checkinModel = new WorkOrderCheckIn();
      checkinModel.WorkOrderSID = this.model.WorkOrderSID;
      this.CheckLocatorStatusAndSave(true, checkinModel);
    }
  }

  checkOut() {
    if (this.isUIComponentProgramAccepted()){
      this.showCheckInForm(false);
    } else {
      var checkoutModel = this.LastCheckIn;
      this.CheckLocatorStatusAndSave(false, checkoutModel);
    }
  }

  editCheckIn(checkIn: WorkOrderCheckIn) {
    if (this.isCheckinEditable) {
      this.showCheckInEditForm(checkIn, true);
    }
  }

  editCheckOut(checkIn: WorkOrderCheckIn) {
    if (this.isCheckinEditable) {
      this.showCheckInEditForm(checkIn, false);
    }
  }

  showCheckInForm(isCheckIn: boolean) {

    let modal = this.modalCtrl.create(CheckInForm, {
      workOrderSID: this.model.WorkOrderSID,
      isCheckIn: isCheckIn,
      lastCheckIn: this.LastCheckIn,
      isEdit: false
    });

    modal.onDidDismiss(data => {
        if (data.checkinModel) {
          this.getCheckInHistory();
          this.model.IsCheckedIn = isCheckIn;
        }
    });
    modal.present();
  }

  showCheckInEditForm(checkIn: WorkOrderCheckIn, isCheckIn: boolean) {
    let modal = this.modalCtrl.create(CheckInForm, { checkIn: checkIn, isCheckIn: isCheckIn, isEdit: true, workOrderCheckinUDFLovs: this.workOrderCheckinUDFLovs });
    modal.present();
  }

  getDate(createdDate: Date) {
    let date = moment(createdDate).format('MM/DD/YYYY');
    return date;
  }

  getTime(createdDate: Date) {
    let time = moment(createdDate + 'Z').utcOffset(-6).format('hh:mm a') + " CST";
    return time;
  }

  changeStatus(): void {
    let newStatus = WorkOrderStatus.InProgress;
    if (this.model.StatusSID == WorkOrderStatus.InProgress) {
      newStatus = WorkOrderStatus.Completed;
    }
    if (newStatus == WorkOrderStatus.Completed && this.model.IsCheckedIn) {
      this.app.showAlert("Unable to Complete", "You are still Checked In. Please Check Out to complete Work Order.");
    }
    else if(newStatus != WorkOrderStatus.Completed) {
      this.workOrderService.changeStatus(this.model.WorkOrderSID, newStatus).then(
        wo => {
          this.model.StatusSID = wo;
          if (wo == WorkOrderStatus.InProgress) {
            this.app.showToast("Work Order started");
            this.changeStatusButton = "Complete";
          }
          if (wo == WorkOrderStatus.Completed) {
            this.app.showToast("Work Order completed");
          }
        },
        error => {
          console.error(error);
          this.app.showErrorToast('An error occurred while changing WO status. Please try again.');
        }
      );
    }
  }

  loadMap() {
    //If lat or lang are null
    if (!this.model.latitude || !this.model.latitude) {
      this.model.SiteAddress = this.addressError;
    }

    this.map = this.geo.getMap(this.model.latitude, this.model.longitude, this.mapEl);

    let marker = this.geo.getMarker(this.model.latitude, this.model.longitude, this.map);
    marker.addListener('click', () => {
      this.geo.getDirections(this.model.latitude, this.model.longitude);
    });

    this.geo.geocodeLatLng(this.model.latitude, this.model.longitude, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          this.model.SiteAddress = results[0].formatted_address;
        } else {
          this.model.SiteAddress = this.addressError;
        }
      } else {
        //This happens if lat=0 and lang=0
        this.model.SiteAddress = this.addressError;
      }
      this.addressReady = true;
    });
  }

  getDocuments(): void {
    this.presentLoading();
    let self = this.Documents;
    this.workOrderService.getDocuments(this.model.WorkOrderSID).then(
      data => {
        //console.log(data);
        let documents = [] as DocumentModel[];

        //Get documents
        var promises = [];
        data.map(doc=>{
          let mimetype = this.fileService.getMimeType(doc.FileName);
          if(this.fileService.isPicture(mimetype)){
            promises.push(
              this.fileService.downloadImgSource(doc.Id, true).toPromise()
              .then(src=>{
                return this.fileService.createDocument(doc, src);
              })
              .catch((err) => {
                console.log(`${doc.FileName} thubmnail was not successfully retrieved. Error Code: ${err.code}`)
              })
            )
          }else{
            let imgSrc = this.fileService.getFileIcon(doc.FileName, doc.Id);
            let document = this.fileService.createDocument(doc, imgSrc);
            documents.push(document);
          }
        })

        Promise.all(promises).then((results)=>{
          for (let doc of results) {
            documents.push(doc);
          }
          this.dismissLoading();
        });

        this.Documents = documents;
        this.DocumentsOriginal = documents;

      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while loading Work Orders. Please try again.");
      }
    );
  }

  getCheckInHistory() {
    this.workOrderService.GetWOCheckInHistory(this.model.WorkOrderSID).then(
      data => {
        this.CheckInHistory = data;
        let checkIns = this.CheckInHistory.filter(checkin => checkin.IsCheckedIn);
        if (checkIns.length > 0) {
          this.LastCheckIn = checkIns.reduce(function (l, e) {
            return e.CheckedInDate > l.CheckedInDate ? e : l;
          });
        }

        let checkinSIDs: number[] = [];
        if (this.CheckInHistory.length > 0){
          this.CheckInHistory.forEach(element => {
            checkinSIDs.push(element.WorkOrderCheckinSID);
          });
        }

        if (checkinSIDs && checkinSIDs.length > 0){
          this.getLogsAndNotes(checkinSIDs);
        }

      },
      error => {
        console.error(error);
        this.app.showToast("An error occurred while loading Work Order Checkin Details.");
      }
    );
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

  toggleSearch() {
    this.toggled = !this.toggled;
    setTimeout(() => {
      if (this.searchbar) this.searchbar.setFocus();
    });
  }

  search(event) {
    // set val to the value of the searchbar
    let val = event.target.value;
    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      console.log(val.toLowerCase());
      this.Documents = this.DocumentsOriginal.filter((item) => {
        return (item.FileName.toLowerCase().indexOf(val.toLowerCase()) > -1)
          || (item.Id.toString().toLowerCase().indexOf(val.toLowerCase()) > -1);
      });
    } else {
      this.Documents = this.DocumentsOriginal.slice();
    }
  }

  showCheckinLayout(){
    return (this.model.StatusSID == 7 && this.auth.userInfo.IsUserGC && !this.model.IsCheckedIn ||
      this.model.StatusSID == 7 && this.auth.userInfo.IsUserGC && this.model.IsCheckedIn && this.LastCheckIn||
      this.model.StatusSID != 6 && this.auth.userInfo.IsUserGC)
  }

  startStopWork(item){
    if (!item.UDFValue){
      this.startSector(item);
    } else if (item.UDFValue.stop == ""){
      this.stopSector(item);
    }
  }

  startSector(sectorUDF){
    this.processSectorWork(sectorUDF, this.START_ACTION);
  }

  stopSector(sectorUDF){
    this.processSectorWork(sectorUDF, this.STOP_ACTION);
  }

  processSectorWork(sectorUDF, action){
    this.app.presentLoading();
    this.workOrderService.SaveSector(sectorUDF.UDFId, this.model.WorkOrderSID, action, this.model.TypeSID).then(
      () => {
        if (action == "start"){
          sectorUDF.UDFValue = {start: "RECORDED", stop: ""};
        } else {
          sectorUDF.UDFValue = {start: "RECORDED", stop: "RECORDED"};
        }
        this.app.dismissLoading();
        console.log("Sector successfully saved.");
      },
      error => {
        this.app.dismissLoading();
        if (error._body && JSON.parse(error._body).ExceptionMessage && JSON.parse(error._body).ExceptionMessage == "INVALID_OPERATION"){
          if (action == "start"){
            this.app.showErrorToast("The sector work log has already started!");
          } else {
            this.app.showErrorToast("The sector work log was already stopped!");
          }
        } else {+
          this.app.showErrorToast("An unknown error occurred. Please try again later.");
        }
        console.error(error);
      }
    );
  }

  getStartStopButtonClass(item) {
    if (!item.UDFValue){
      return "start-btn";
    } else if (item.UDFValue.stop == ""){
      return "stop-btn";
    } else{
      return "finished-btn";
    }
  }

  getStartStopButtonText(item) {
    if (!item.UDFValue){
      return "Start";
    } else if (item.UDFValue.stop == ""){
      return "Complete";
    } else{
      return "Completed";
    }
  }

  getIconName(item): string{
    if (!item.UDFValue){
      return "md-play";
    } else if (item.UDFValue.stop == ""){
      return "md-checkmark";
    } else{
      return "md-checkmark-circle-outline";
    }
  }

  getCheckinNote(WorkOrderCheckinSID): string{
    return this.getNote(WorkOrderCheckinSID, "CheckIn");
  }

  getCheckoutNote(WorkOrderCheckinSID): string{
    return this.getNote(WorkOrderCheckinSID, "CheckOut");
  }

  getNote(WorkOrderCheckinSID, fieldServiceType): string{
    let note = "";
    let element = this.fsmLogs.filter(fsmLog => fsmLog.WorkOrderCheckinActivitySID == WorkOrderCheckinSID && fsmLog.FieldServiceType == fieldServiceType)[0];
    if (element){
      note = element.Note;
    }
    return note;
  }

  getCheckinLogs(WorkOrderCheckinSID): any[]{
    return this.getLogs(WorkOrderCheckinSID, "CheckIn");
  }

  getCheckoutLogs(WorkOrderCheckinSID): any[]{
    return this.getLogs(WorkOrderCheckinSID, "CheckOut");
  }

  getLogs(WorkOrderCheckinSID, fieldServiceType): any[]{
    let logs = [];
    let element = this.fsmLogs.filter(fsmLog => fsmLog.WorkOrderCheckinActivitySID == WorkOrderCheckinSID && fsmLog.FieldServiceType == fieldServiceType)[0];
    if (element){
      logs = element.Logs;
    }
    return logs;
  }

  downloadCheckinLog(log): void{
    this.download(log, "CheckIn");
  }

  downloadCheckoutLog(log): void{
    this.download(log, "CheckOut");
  }

  getFileName(log){
    let attachment = log.LogAttachment;
    if (!attachment){
      return;
    }
    
    var index = attachment.lastIndexOf("/");
    return attachment.substring(index+1);
  }

  download(log, fieldServiceType: string): void {     
    //Make sure this is on a device, not an emulation (e.g. chrome tools device mode)
    if(!this.app.platform.is('cordova')) {
      return;
    }

    let attachment = log.LogAttachment;
    if (!attachment){
      return;
    }

    this.app.presentLoading("Downloading...");

    var index = attachment.lastIndexOf("/");
    var fileName = attachment.substring(index+1);

    console.log(`Downloading file ${fileName}`);
    this.workOrderService.downloadLog(attachment, fileName).then(
     (entry) => {      
       this.app.dismissLoading();
       console.log(entry.toURL());
       const alertSuccess = this.alertCtrl.create({
        title: `Download Succeeded!`,
        message: `File ${fileName} ready on app storage folder. Do you want to open it?`,
        buttons: [
          {
            text: 'No'
          },
          {
            text: 'Yes',
            handler: data => {
              console.log(`File entry ${entry.fullPath}`);
              let filePath = this.fileService.getStorageDirectory() + fileName;
              this.fileService.openFile(filePath)
                .then(() => console.log('File is opened'))
                .catch(e => console.log('Error openening file', e));
            }
          }
        ]
      });

      alertSuccess.present();
     },
     error => {
      console.log("Download error source " + error.source);
      console.log("Download error target " + error.target);
      console.log("Download error code" + error.code);
       this.app.dismissLoading();
       this.app.showErrorToast("Oops! An error has occurred downloading file: " +  fileName);
     }
    );
  }

  CheckLocatorStatusAndSave(isCheckIn: boolean, model: WorkOrderCheckIn) {
    if (this.app.isApp()) {
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
        result => {
          console.log('Has PERMISSION?', result.hasPermission);
          if (result.hasPermission) {
            this.CheckIfLocationOnAndSave(isCheckIn, model);
          } else {
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
              success => {
                if (success.hasPermission) {
                  this.CheckIfLocationOnAndSave(isCheckIn, model);
                } else {
                  this.app.showAlert("Unable to " + (isCheckIn ? "Check In" : "Check Out"),
                    "Please try again and make sure to allow Location access to continue");
                }
              },
              error => {
                this.app.showErrorToast("An error occured trying to request for Location permission");
              }
            );
          }
        },
        err => {
          this.app.showErrorToast("An error occured trying to check for Location permission");
        }
      );
    } else {
      this.SaveWorkOrderCheckIn(isCheckIn, model);
    }
  }

  CheckIfLocationOnAndSave(isCheckIn: boolean, model: WorkOrderCheckIn) {
    this.locationAccuracy.canRequest().then((canRequest: boolean) => {
      if (canRequest) {
        this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
          () => {
            console.log('Request successful');
            if (this.app.isiOS()) {
              this.app.showToast("Please enable Location Services and try again!");
            }
            else {
              this.SaveWorkOrderCheckIn(isCheckIn, model);
            }
          },
          error => {
            //For example, the user chose not to make required location settings changes.
            this.app.showAlert("Unable to " + (isCheckIn ? "Check In" : "Check Out"),
              "Please try again and make sure to turn on Location Services to continue");
          }
        );
      } else {
        if (this.app.isiOS()) {
          this.SaveWorkOrderCheckIn(isCheckIn, model);
        }
        else {
          this.app.showErrorToast("An error occurred trying to check if Location is ON");
        }
      }
    });
  }

  SaveWorkOrderCheckIn(isCheckIn: boolean, model: WorkOrderCheckIn) {
    this.presentLoading();
    this.geo.getGeolocation().then((position) => {
      model.UDFsTransposed = new WorkOrderCheckInUDF();
      if (isCheckIn) {
        model.IsCheckedIn = true;
        model.CheckedInLatitude = position.coords.latitude;
        model.CheckedInLongitude = position.coords.longitude;
      }
      else {
        model.IsCheckedIn = false;
        model.CheckedOutLatitude = position.coords.latitude;
        model.CheckedOutLongitude = position.coords.longitude;
      }
      this.workOrderService.SaveWorkOrderCheckIn(model).then(
        response => {
          this.dismissLoading();
          this.getCheckInHistory();
          this.model.IsCheckedIn = isCheckIn;
        },
        error => {
          console.error(error);
          this.app.showErrorToast("An error occurred while saving the information. Please try again.");
          this.dismissLoading();
        }
      );
    },
      error => {
        console.log(error);
        this.dismissLoading();
        this.app.showErrorToast("An error occurred while accessing your location. Please make sure location services are enabled and try again.");
      }
    );
  }

  isSectorWorkAvailable(): boolean {
    return this.app.programFeatures.work_order.filter(wo => wo.typeSID == this.model.TypeSID)[0].sector_work && this.model.StatusSID == WorkOrderStatus.InProgress;
  }

  isUIComponentProgramAccepted(): boolean {
    return this.app.programFeatures.work_order.filter(wo => wo.typeSID == this.model.TypeSID)[0].general_info;
  }

  logsEnabled(): boolean{
    return this.app.programFeatures.work_order.filter(wo => wo.typeSID == this.model.TypeSID)[0].logs;
  }
}
