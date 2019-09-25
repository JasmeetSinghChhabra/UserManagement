import { Component, ViewChild, Renderer, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController, Platform } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DfrService, SignatureService, AuthService } from '../../services/services';
import { DfrModel, CrewMember } from '../../models/models';
import { Helper } from '../../utils/utils';
import { Signature } from '../../components/signature/signature';
import { SelectSearchable } from '../../components/select-searchable/select-searchable';
import { DfrApproveReject } from './dfr-approve-reject';
import { AudioNoteComponent } from '../../components/audio-note/audio-note';
import * as moment from 'moment';
  
//@IonicPage()
@Component({
  selector: 'dfr-form',
  templateUrl: 'dfr-form.html',
  providers: [DfrService]
})
export class DfrForm extends BasePage {

  @ViewChild('dfrForm') dfrForm: NgForm;
  @ViewChild('workPerformedAudioNote') workPerformedAudioNote: AudioNoteComponent;
  WorkTypes: any[];
  Sites: any[];
  Diems: any[];
  Employees: any[];
  EmployeeTypes: any[];
  LunchDurationArr: any[] = [{ Id: 0, Value: 'None' }, { Id: 15, Value: '15mins' }, { Id: 30, Value: '30mins' }, { Id: 45, Value: '45mins' }, { Id: 60, Value: '1hr' }];
  model: DfrModel;
  WorkPerformedAudioNotes: any[] = [];
  page: string;
  itemExpandHeight: number = 100;
  lastFocusedText: any;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private auth: AuthService,
    private dfrService: DfrService, private app: AppService, private signatureService: SignatureService,
    private alertCtrl: AlertController, private modalCtrl: ModalController, private helper: Helper,
    private renderer: Renderer, private elementRef: ElementRef) {
    super(loadingCtrl);
    this.page = "form";
    this.model = navParams.get('item');
    if (!this.model) {
      //This is a new DFR
      this.model = new DfrModel();
      this.model.ReportDate = moment().format('YYYY-MM-DD');
      this.model.ProjectId = this.app.projectId;
      this.model.Status = "New";
    }
  }

  ngOnInit(): void {
    this.getTemplates();    
  }

  ngAfterViewInit() {
    //console.log(`Pending audios: ${this.workPerformedAudioNote.hasPendingUploads()}`);
  }

  getTemplates(): void {
      this.presentLoading();
      this.dfrService.getTemplates().subscribe(
        data => {
          //console.log(data);
          this.WorkTypes = data.WorkTypes;
          this.Sites = data.Sites;
          this.EmployeeTypes = data.EmployeeTypes;
          this.Employees = data.Employees;
          this.Diems = data.Diems;

          if (!this.model.ReportId) {
            //This a new DFR
            this.dismissLoading();
          } else {
            this.getDfr();
          }          
        },
        error => {
          console.error(error);
          this.dismissLoading();
        }
      );
  }

  getDfr(): void {
    this.dfrService.getDfr(this.model.ReportId).subscribe(
      dfr => {
        //console.log(data);
        this.model = dfr;
        this.model.ReportDate = moment(this.model.ReportDate).format('YYYY-MM-DD');
        if (this.model.WorkPerformedCompletedAudioNote) {
          this.WorkPerformedAudioNotes = [{
            fileName: this.model.WorkPerformedCompletedAudioNote,
            user: this.model.WorkPerformedCompletedAudioNoteUser
          }];
        }
        this.setCrew();
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
      }
    );
  }

  setCrew(): void {
    for (var i = 0; i < this.model.ReportEmployees.length; i++) {
      let name: string;
      let canDrive: string;
      if (this.model.ReportEmployees[i]["Employee"]) {
        name = this.model.ReportEmployees[i]["Employee"].EmployeeName;
        canDrive = this.model.ReportEmployees[i]["Employee"].CanDrive;
      } else {
        let employeeId = this.model.ReportEmployees[i].Id;
        let selectedEmployee = this.Employees.filter(x => x.EmployeeId == employeeId)[0];
        name = selectedEmployee.EmployeeName;
        canDrive = selectedEmployee.CanDrive;  
      }

      let perDiem = this.model.ReportEmployees[i].PerDiemId == 1;
      let workStart = moment(this.model.ReportEmployees[i].StartTime).format("HH:mm");
      let workEnd = moment(this.model.ReportEmployees[i].StopTime).format("HH:mm");

      if (this.model.ReportEmployees[i].LunchDuration == null) {
        this.model.ReportEmployees[i].LunchDuration = 0;
      }

      Object.defineProperty(this.model.ReportEmployees[i], 'Expanded', { value: false, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'Name', { value: name, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'WorkedHours', { value: 'Select start/stop time', writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'WorkedHoursValid', { value: true, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'PerDiem', { value: perDiem, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'CanDrive', { value: canDrive, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'WorkStart', { value: workStart, writable: true });
      Object.defineProperty(this.model.ReportEmployees[i], 'WorkStop', { value: workEnd, writable: true });

      this.setDateRange(this.model.ReportEmployees[i]);
    }
  }

  missingFieldsForSave(): string[] {
    let missingFields = [];

    if (!this.model.SiteNumber) {
      missingFields.push("Site Number");
    }
    if (!this.model.ReportDate) {
      missingFields.push("Report Date");
    }
    if (!this.model.WorkTypeId) {
      missingFields.push("Work Type");
    }
    if (this.model.SiteNumber != null && this.model.SiteNumber === "OH19446" && (this.model.CascadeId == null || this.model.CascadeId === "")) {      
      missingFields.push("Additional Site Details");        
    }
    //if (this.workPerformedAudioNote.hasPendingUploads()) {
    //  missingFields.push("Upload recorded audio");
    //}
    return missingFields;
  }

  missingFieldsForSubmit(): string[] {
    let missingFields = [];

    if (!this.model.WorkPerformedCompleted && this.workPerformedAudioNote.tracks.length == 0) {
      missingFields.push("Work Performed (Text or Audio)");
    }
    else if (this.workPerformedAudioNote.tracks.length == 0 && this.model.WorkPerformedCompleted && this.model.WorkPerformedCompleted.length < 250) {
      missingFields.push("Work Performed: Minimum 250 characters or add an audio note");
    }
    if (this.model.ReportEmployees.length == 0) {
      missingFields.push("Add Crew");
    }

    return missingFields;
  }

  missingCrewInfoForSave(): string[] {
    let missingFields = [];

    for (var i = 0; i < this.model.ReportEmployees.length; i++) {
      if (this.isSignDisabled(this.model.ReportEmployees[i])) {
        missingFields.push(`Crew Member [${i+1}]`);
      }
      this.validateOverlappingTimeInCrew(i, missingFields);
    }

    return missingFields;
  }

  missingCrewInfoForSubmit(): string[] {
    let missingFields = [];
    let isOneCrewFormanOrSuperVisor = false;
    for (var i = 0; i < this.model.ReportEmployees.length; i++) {
      if (this.isSignDisabled(this.model.ReportEmployees[i])) {
        missingFields.push(`Crew Member [${i + 1}]`);
      }
      else if (!this.model.ReportEmployees[i].IsSigned) {
        missingFields.push(`Crew Member [${i + 1}] need signature`);
      }
      if (this.model.ReportEmployees[i].EmployeeTypeId == 1 || this.model.ReportEmployees[i].EmployeeTypeId == 2) {
        isOneCrewFormanOrSuperVisor = true;
      }
      this.validateOverlappingTimeInCrew(i, missingFields);
    }

    if (this.model.ReportEmployees.length > 0 && !isOneCrewFormanOrSuperVisor) {
      missingFields.push("There must be at least one Crew Foreman or Construction Supervisor");
    }

    return missingFields;
  }

  validateOverlappingTimeInCrew(i, missingFields): void {
    var iEmployee = this.model.ReportEmployees[i];

    for (var j = i + 1; j < this.model.ReportEmployees.length; j++) {
      var jEmployee = this.model.ReportEmployees[j];
      if (jEmployee.Id == iEmployee.Id
        && ((jEmployee.StartTime >= iEmployee.StartTime
        && jEmployee.StartTime < iEmployee.StopTime) 
        ||(iEmployee.StartTime >= jEmployee.StartTime
        && iEmployee.StartTime < jEmployee.StopTime)))
         {
        missingFields.push(`Crew Member [${i + 1}] Overlapping times for same Employee`);
      }
    }
  }

  buildValidationList(validations: string[]): string {
    let list = "<ul>";
    for (var i = 0; i < validations.length; i++) {
      list += `<li>${validations[i]}</li>`;
    }
    list += "</ul>";
    return list;
  }

  saveDfr(): void {    
    //Check general info missing fields
    let missingFields = this.missingFieldsForSave();
    missingFields = missingFields.concat(this.missingCrewInfoForSave());
    if (missingFields.length > 0) {     
      let alert = this.alertCtrl.create({
        title: 'Save Validation',
        message: `<p>Below mandatory fields are not filled:</p>${this.buildValidationList(missingFields)}`,
        buttons: ['OK']
      });
      alert.present();
      return;
    }

    //Check for pending audio notes and upload it
    if (this.checkPendingAudios(() => {
      this.saveDfr();
    })) {
      console.log("No pending audios to upload, proceed with save operation");
      return;
    }

    this.model.Status = "Saved";
    //console.log(this.model);
    this.presentLoading("Saving...");
    this.dfrService.saveOrUpdateDfr(this.model).subscribe( 
      dfr => {
        //console.log(dfr);
        this.setupModel(dfr);
        this.app.showToast("DFR saved successfully!", "success");
        this.dismissLoading();
      },
      error => {
        console.error(error);
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`An error occurred saving DFR. ${odataError ? odataError : ""}`);
        this.dismissLoading();
      }
    );
  }

  submitDfr(): void {
    let missingFields = this.missingFieldsForSave();
    missingFields = missingFields.concat(this.missingFieldsForSubmit());
    missingFields = missingFields.concat(this.missingCrewInfoForSubmit());
    if (missingFields.length > 0) {
      let alert = this.alertCtrl.create({
        title: 'Submit Validation',
        message: `<p>Below mandatory fields are not filled:</p>${this.buildValidationList(missingFields)}`,
        buttons: ['OK']
      });
      alert.present();
      return;
    }

    //Check for pending audio notes and upload it
    if (this.checkPendingAudios(() => {
      this.submitDfr();
    })) {
      console.debug("No pending audios to upload, proceed with submit operation");
      return;
    }

    let previousStatus = this.model.Status;
    this.model.Status = "Submitted";
    //console.log(this.model);
    this.presentLoading("Submitting...");
    this.dfrService.saveOrUpdateDfr(this.model).subscribe(
      dfr => {
        //TODO: go to DFR list?
        this.app.navCtrl.pop();
        this.setupModel(dfr);
        this.app.showToast("DFR submitted successfully!", "success");
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.model.Status = previousStatus;
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`An error occurred submitting DFR. ${odataError ? odataError : ""}`);
        this.dismissLoading();
      }
    );
  }

  checkPendingAudios(callback): boolean {
    if (!this.app.isApp()) return false;

    if (this.workPerformedAudioNote 
      && this.workPerformedAudioNote.hasPendingUploads()) {
      this.presentLoading("Uploading audios...");
      this.workPerformedAudioNote.uploadAllPendingAudios().then(audios => {
        console.debug(audios);
        this.dismissLoading();
        if (callback) {
          callback();
        }
      }, error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("Error uploading audio notes");
        });
      return true;
    }
    return false;
  }

  setupModel(dfr): void {
    this.model = dfr;
    this.model.ReportDate = moment(this.model.ReportDate).format('YYYY-MM-DD');
    this.setCrew();
  }

  addCrew(): void {
    let newMember = new CrewMember();
    
    //If there is a crew member already created check the start/end and set the same to the new one
    if (this.model.ReportEmployees.length > 0) {
      newMember["WorkStart"] = this.model.ReportEmployees[0]["WorkStart"];
      newMember["WorkStop"] = this.model.ReportEmployees[0]["WorkStop"];
      this.setDateRange(newMember);      
    }
    this.model.ReportEmployees.push(newMember);
    this.setPerDiem(newMember);
    this.expandCrewMember(newMember);
  }

  editCrew(event, item): void {    
    this.expandCrewMember(item);
  }

  expandCrewMember(crewMember): void {
    this.model.ReportEmployees.map((listItem) => {
      if (crewMember == listItem) {
        listItem["Expanded"] = !listItem["Expanded"];
      } else {
        listItem["Expanded"] = false;
      }
      return listItem;
    });
  }

  removeCrew(event, crewMember): void {
    let index = this.model.ReportEmployees.indexOf(crewMember);

    if (index > -1) {
      this.model.ReportEmployees.splice(index, 1);
    }
  }

  createSignModal(self, crewMember, ReportId, ReportemployeeSid): void {
    var projectIdUrl = "?projectId=" + self.model.ProjectId.toString();
    var entityKey = self.app.config.odataEndpoint + "/ReportEmployees(reportId=" + ReportId
      + ",employeeId=" + crewMember.Id
      + ",reportemployeeSid=" + ReportemployeeSid + ")";

    let modal = self.modalCtrl.create(Signature,
      {
        canvasDisabled: crewMember.IsSigned,
        signatureTitle: `Signature [${crewMember.Name}]`,
        imgUrl: entityKey + "$value" + projectIdUrl        
      });

    modal.onDidDismiss(data => {
      if (!data) return;

      this.presentLoading("Signing...");
      var blobBin = atob(data.split(",")[1]);
      var array = [];
      for (var i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      var file = new Blob([new Uint8Array(array)], { type: "image/png" });

      let body = {
        'ReportId': ReportId,
        'Id': crewMember.Id,
        'ReportemployeeSid': ReportemployeeSid,
        'uploadedfile;filename=': "images/signature.png",
        'Stream': file
      };

      let errorHandler = (error) => {
        this.dismissLoading();
        console.error(error);
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`Oops! An error occurred signing employee. ${odataError ? odataError : ""}`);
      }

      let successHandler = () => {
        crewMember.IsSigned = true;
        this.dismissLoading();
        self.app.showToast(crewMember.Name + " signed successfully!", "success");
      }
      self.signatureService.saveSignature(entityKey + projectIdUrl, body, errorHandler, successHandler);
    });
    this.dismissLoading();
    modal.present();
  }

  signCrew(event, crewMember): void {
    let index = this.model.ReportEmployees.indexOf(crewMember);
    let missingFields = this.missingFieldsForSave();
    missingFields = missingFields.concat(this.missingCrewInfoForSave());
    if (missingFields.length > 0) {
      let alert = this.alertCtrl.create({
        title: 'Sign Validation',
        message: `<p>Please, review missing info before sign:</p>${this.buildValidationList(missingFields)}`,
        buttons: ['OK']
      });
      alert.present();
      return;
    }
    var self = this;
    this.presentLoading("Saving...");
    if (crewMember.IsSigned) {
      this.createSignModal(self, crewMember, self.model.ReportId.toString(), crewMember.ReportemployeeSid);
    } else {
      this.model.Status = "Saved";
      this.dfrService.saveOrUpdateDfr(this.model).subscribe(
        dfr => {
          this.setupModel(dfr);
          //crewMember = dfr.ReportEmployees.filter(x => x.ReportemployeeSid == crewMember.ReportemployeeSid)[0]; //The same crew member can be twice
          crewMember = dfr.ReportEmployees[index];        
          this.createSignModal(self, crewMember, self.model.ReportId.toString(), crewMember.ReportemployeeSid);
        },
        error => {
          console.error(error);
          let odataError = this.helper.parseOdataError(error);
          this.app.showErrorToast(`Oops! An error occurred submitting DFR. ${odataError ? odataError : ""}`);
          this.dismissLoading();
        }
      );
    }   
  }

  setEmployee(event, crewMember): void {
    let selectedEmployee = this.Employees.filter(x => x.EmployeeId == event.value)[0];
    crewMember.Name = selectedEmployee.EmployeeName;
    crewMember.CanDrive = selectedEmployee.CanDrive;  
  }

  employeeTemplate(employee) {
    let itemText = `${employee.EmployeeName}`;
    if (employee.CanDrive) itemText += " (Can Drive)";
    return itemText;
  }

  setDateRange(crewMember): void {
    if (crewMember.WorkStart && crewMember.WorkStop) {
      //Calculate start date time
      let startDate = moment(this.model.ReportDate);
      let start = moment.duration(crewMember.WorkStart);
      startDate.hours(start.get('hours')).minutes(start.get('minutes'));      
      //Calculate stop date time         
      let stop = moment.duration(crewMember.WorkStop);
      let stopDate = moment(this.model.ReportDate);
      stopDate.hours(stop.get('hours')).minutes(stop.get('minutes'));
      //Check if the time tange is valid
      if (start > stop) {
        this.app.showToast("Start Time must be before Stop Time", "error");
        crewMember.WorkedHours = "Invalid time range";
        crewMember.WorkedHoursValid = false;
        return;
      }
      //Set StartTime/StopTime
      crewMember.StartTime = startDate.format('YYYY-MM-DDTHH:mm');   
      crewMember.StopTime = stopDate.format('YYYY-MM-DDTHH:mm'); 
      //Calculate total work hours
      stop.subtract(start);

      // get lunch duration and substracted from stop
      let lunchDuration = moment.duration("00:" + (crewMember.LunchDuration == '0' ? "00" : crewMember.LunchDuration));
      if (lunchDuration > stop) {
        this.app.showToast("Break Time should be less than work total hours", "error");
        crewMember.WorkedHours ="Break Time should be less than work total hours";
        crewMember.WorkedHoursValid = false;
        return;
      }
      stop.subtract(lunchDuration);

      let hours = stop.get('hours') < 10 ? `0${stop.get('hours')}` : stop.get('hours');
      let minutes = stop.get('minutes') < 10 ? `0${stop.get('minutes')}` : stop.get('minutes');      
      crewMember.WorkedHours = `Worked ${hours}:${minutes} hour(s)`;
      crewMember.WorkedHoursValid = true;
    }
  }

  setPerDiem(crewMember): void {
    if (crewMember.PerDiem) {
      let perDiemModel = this.Diems.filter(x => x.Value == "Yes")[0];
      crewMember.PerDiemId = perDiemModel.PerDiemId;
    } else {
      let perDiemModel = this.Diems.filter(x => x.Value == "No")[0];
      crewMember.PerDiemId = perDiemModel.PerDiemId;
    }
  }

  isSignDisabled(crewMember): boolean {
    if (crewMember.StartTime == null || crewMember.StopTime == null || crewMember.EmployeeTypeId == null || crewMember.Id == null || crewMember.WorkedHoursValid == false || crewMember.LunchDuration == null ) {
      return true;
    }
    return false;
  }

  getEmployeeTypeClass(crewMember): string {    
    switch (crewMember.EmployeeTypeId) {
      case 1:
        return "icon-constructionsupervisor";
      case 2:
        return "icon-foreman";
      case 3:
        return "icon-tt1";
      case 4:
        return "icon-tt2";
      case 5:
        return "icon-tt3";
      case 6:
        return "icon-civiltechnician";
      default: return "";
    }
  }

  workPerformedCompletedLength(): number {
    if (this.model.WorkPerformedCompleted) {
      return this.model.WorkPerformedCompleted.length;
    } else {
      return 0;
    }
  }

  isSiteDateDisabled(): boolean {
    if (this.model.Status != 'New') {
      return true;
    }
    return false;
  }

  approveDfr(): void {
    let approveModal = this.modalCtrl.create(DfrApproveReject, { 'action': "Approve", 'reportId': this.model.ReportId });
    approveModal.present();
  }

  rejectDfr(): void {
    let rejectModal = this.modalCtrl.create(DfrApproveReject, { 'action': "Reject", 'reportId': this.model.ReportId });
    rejectModal.present();
  }

  showWindow(title: string, message: string, callback: (comment: string) => any): void {
    let prompt = this.alertCtrl.create({
      title: title,
      message: message,
      inputs: [
        {
          name: 'comment',
          placeholder: 'Comment'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Ok',
          handler: data => {
            return callback(data.comment);
          }
        }
      ]
    });
    prompt.present();
  }  

  isEditDisabled(): boolean {
    if (this.model.Status == "Submitted" || this.model.Status == "Approved") {
      return true;
    }
    return false;
  }

  isCrewDisabled(crewMember): boolean {
    if (this.isEditDisabled() || crewMember.IsSigned) {
      return true;
    } else {
      return false;
    }
  }

  showCrewList(): boolean {
    if(this.model.ReportEmployees && this.model.ReportEmployees.length == 0){
      return false;
    }
    return true;
  }

  siteChange(event: { component: SelectSearchable, value: any }) {
    console.log('value:', event.value);
  }

  onWorkPerformedAudioUploaded(fileName: string) {
    console.log(`Work performed audio note uploaded: ${fileName}`);
    this.model.WorkPerformedCompletedAudioNote = fileName;
    this.model.WorkPerformedCompletedAudioNoteUser = this.auth.userInfo.UserName;
    //this.saveDfr(); //The save functions is already checking for pending to upload audios
  }

  onWorkPerformedAudioRemoved(fileName: string) {
    console.log(`Work performed audio note removed: ${fileName}`);
    this.model.WorkPerformedCompletedAudioNote = "";
    this.model.WorkPerformedCompletedAudioNoteUser = "";
    this.saveDfr();
  }

}
