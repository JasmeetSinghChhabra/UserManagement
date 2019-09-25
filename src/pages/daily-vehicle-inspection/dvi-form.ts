import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DviService, SignatureService } from '../../services/services';
import { DviModel } from '../../models/models';
import { Helper } from '../../utils/utils';
import { Signature } from '../../components/signature/signature';
import { SelectSearchable } from '../../components/select-searchable/select-searchable';
import * as moment from 'moment';

//@IonicPage()
@Component({
  selector: 'dvi-form',
  templateUrl: 'dvi-form.html',
  providers: [DviService]
})
export class DviForm extends BasePage {

  @ViewChild('dviForm') public dviForm: NgForm;
  //@ViewChild('truckComponents') truckComp: SelectSearchable;

  VehicleInspectionTrailerComponents: any[];
  VehicleInspectionTrailers: any[];
  VehicleInspectionTruckComponents: any[];
  Employees: any[];
  VehicleInspectionTrucks: any[];
  truckComponents: any[];
  trailerComponents: any[];
  model: DviModel;
  page: string;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams,
    private dviService: DviService, private app: AppService, private signatureService: SignatureService,
    private alertCtrl: AlertController, private modalCtrl: ModalController, private helper: Helper) {
    super(loadingCtrl);
    this.page = "carrier";
    this.model = navParams.get('item');

    if (!this.model) {
      //This is a new DVI
      this.model = new DviModel();
      this.model.InspectionDate = moment().format('YYYY-MM-DD');
      this.model.DviStatusId = "New";
      this.model.TruckNo = "No Truck";
      this.model.VehicleInspectionTrailerDetails[0].TrailerNo = "No Trailer";
      this.truckComponents = [];
      this.trailerComponents = [];
    } else {
      //This is an existing DVI but we set up the TrailerNo here, in other case the binding fails
      this.model["VehicleInspectionTrailerDetails"] = [];
      this.model.VehicleInspectionTrailerDetails.push({ TrailerNo: "No Trailer" });
      this.truckComponents = [];
      this.trailerComponents = [];
    }    
  }

  ngOnInit(): void {
    this.getTemplates();
  }

  getTemplates(): void {
    this.presentLoading();
    this.dviService.getTemplates().subscribe(
      data => {
        //console.log(data);
        this.Employees = data.Employees;
        this.VehicleInspectionTrailerComponents = data.VehicleInspectionTrailerComponents;
        this.VehicleInspectionTrailers = data.VehicleInspectionTrailers;
        this.VehicleInspectionTruckComponents = data.VehicleInspectionTruckComponents;
        this.VehicleInspectionTrucks = data.VehicleInspectionTrucks;

        if (!this.model.VehicleInspectionId) {
          //This a new DVI
          this.dismissLoading();
        } else {
          this.getDvi();
        }
      },
      error => {
        console.error(error);
        this.dismissLoading();
      }
    );
  }

  getDvi(): void {
    this.dviService.getDvi(this.model.VehicleInspectionId).subscribe(
      dvi => {
        //console.log(data);
        this.setupModel(dvi);
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
      }
    );
  }

  saveDvi(): void {
    this.model.DviStatusId = "Saved";
    this.updateModelDetails();
    //console.log(this.model);
    this.presentLoading("Saving...");
    this.dviService.saveOrUpdateDfr(this.model).subscribe(
      dvi => {
        //console.log(dvi);
        this.setupModel(dvi);
        this.app.showToast("DVI saved successfully!", "success");
        this.dismissLoading();
      },
      error => {
        console.error(error);
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`Oops! An error occurred saving DVI. ${odataError ? odataError : ""}`);
        this.dismissLoading();
      }
    );
  }

  submitDvi(): void {
    let missingFields = this.missingFieldsForSubmit();
    if (missingFields.length > 0) {
      let alert = this.alertCtrl.create({
        title: 'Submit Validation',
        message: `<p>Below mandatory fields are not filled:</p>${this.buildValidationList(missingFields)}`,
        buttons: ['OK']
      });
      alert.present();
      return;
    }
    this.model.DviStatusId = "Submitted";
    this.updateModelDetails();
    //console.log(this.model);
    this.presentLoading("Submitting...");
    this.dviService.saveOrUpdateDfr(this.model).subscribe(
      dvi => {
        this.setupModel(dvi);
        this.app.showToast("DVI submitted successfully!", "success");
        this.dismissLoading();
      },
      error => {
        console.error(error);
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`Oops! An error occurred submitting DVI. ${odataError ? odataError : ""}`);
        this.dismissLoading();
      }
    );
  }

  setupModel(dvi) {
    this.model = dvi;
    this.model.InspectionDate = moment(this.model.InspectionDate).format('YYYY-MM-DD');
    this.model.InspectionTime = moment(this.model.InspectionTime, ["HH:mm"]).format("hh:mm");

    if (!this.model.VehicleInspectionTrailerDetails[0]) {
      this.model.VehicleInspectionTrailerDetails.push({ TrailerNo: "No Trailer" });
    }
    for (var i = 0; i < this.model.VehicleInspectionComponentDetails.length; i++) {
      let componentId = this.model.VehicleInspectionComponentDetails[i].VehicleInspectionComponentId;
      let truckComponent = this.VehicleInspectionTruckComponents.find(function(item) {
        return item.ComponentId === componentId;
      });
      if (truckComponent) {
        this.truckComponents.push(truckComponent);
      } else {
        let trailerComponent = this.VehicleInspectionTrailerComponents.find(function (item) {
          return item.ComponentId === componentId;
        });
        if (trailerComponent) this.trailerComponents.push(trailerComponent);
      }
    }
  }

  updateModelDetails() {
    //Update the truck and trailer components array
    this.updateComponentDetails(this.truckComponents, this.trailerComponents);
    this.model.InspectionTime = moment.duration(this.model.InspectionTime).toJSON();
  }

  updateComponentDetails(truckComponents, trailerComponents) {
    this.model.VehicleInspectionComponentDetails = [];
    for (var i = 0; i < truckComponents.length; i++) {
      this.model.VehicleInspectionComponentDetails.push({
        VehicleInspectionComponentId: truckComponents[i].ComponentId
      });
    }
    for (var j = 0; j < trailerComponents.length; j++) {
      this.model.VehicleInspectionComponentDetails.push({
        VehicleInspectionComponentId: trailerComponents[j].ComponentId
      });
    }
  }

  missingFieldsForSubmit(): string[] {
    let missingFields = [];

    if (!this.model.InspectionCarrier) {
      missingFields.push("Carrier");
    }
    if (!this.model.InspectionAddress) {
      missingFields.push("Address");
    }
    if (!this.model.TruckNo) {
      missingFields.push("Truck #");
    }
    if (!this.model.InspectionTime) {
      missingFields.push("Time");
    }
    if (!this.model.ConditionSatisfactory) {
      if (!this.model.IsMechanicSigned) {
        missingFields.push("Mechanic/Manager Signature");
      }
    }
    if (!this.model.IsDriverSigned) {
      missingFields.push("Driver Signature");
    }
    return missingFields;
  }

  buildValidationList(validations: string[]): string {
    let list = "<ul>";
    for (var i = 0; i < validations.length; i++) {
      list += `<li>${validations[i]}</li>`;
    }
    list += "</ul>";
    return list;
  }

  sign(event, signType): void {
    let self = this;
    let isSigned = false;
    if (signType == "Driver") {
      isSigned = this.model.IsDriverSigned;
    } else {
      isSigned = this.model.IsMechanicSigned;
    }
    this.presentLoading("Saving...");
    if (self.model.VehicleInspectionId) {
      this.createSignModal(self, signType, self.model.VehicleInspectionId.toString(), isSigned);
    } else {
      this.model.DviStatusId = "Saved";
      this.updateModelDetails();
      this.dviService.saveOrUpdateDfr(this.model).subscribe(
        dvi => {
          this.setupModel(dvi);
          this.createSignModal(self, signType, self.model.VehicleInspectionId.toString(), isSigned);
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

  createSignModal(self, signType, id, isSigned): void {
    var projectIdUrl = `?projectId=${this.app.projectId.toString()}`;
    var entityKey = self.app.config.odataEndpoint + "/VehicleInspections(" + id + ")";

    let modal = self.modalCtrl.create(Signature,
      {
        canvasDisabled: isSigned,
        imgUrl: entityKey + "/" + signType + "Signature" + "/$value" + projectIdUrl
      });

    modal.onDidDismiss(data => {
      if (!data) return;

      this.presentLoading("Signing...");
      var blobBin = atob(data.split(",")[1]);
      var array = [];
      for (var i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      var file = new File([new Uint8Array(array)], signType + "Signature", { type: "image/png" });

      let body = {
        'key': id,
        'property': signType + "Signature",
        'uploadedfile;filename=': `images/signature.png`,
        'Stream': file
      };

      let errorHandler = (error) => {
        this.dismissLoading();
        console.error(error);
        let odataError = this.helper.parseOdataError(error);
        this.app.showErrorToast(`Oops! An error occurred signing employee. ${odataError ? odataError : ""}`);
      };
      let successHandler = () => {
        if (signType == "Driver") {
          self.model.IsDriverSigned = true;
        } else {
          this.model.IsMechanicSigned = true;
        }
        this.dismissLoading();
        self.app.showToast(signType + " signed successfully!", "success");
      };
      self.signatureService.saveSignature(entityKey + projectIdUrl, body, errorHandler, successHandler);
    });
    this.dismissLoading();
    modal.present();
  }

}
