import { Component } from '@angular/core';
import { BaseComponent } from '../../../../components/base.component';
import { NavParams, ViewController, LoadingController } from 'ionic-angular';
import { AppService, GeoService, WorkOrderService, FileService } from '../../../../services/services';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { WorkOrderCheckIn, WorkOrderCheckInUDF } from '../../../../models/work-order/work-order.model';
import { FileTransfer, FileTransferObject, FileUploadOptions } from '@ionic-native/file-transfer';
import { Camera, CameraOptions } from '@ionic-native/camera';

@Component({
  selector: 'CheckIn-form',
  templateUrl: 'CheckIn-form.html',
  providers: [WorkOrderService, FileService]
})

export class CheckInForm extends BaseComponent {

  model: WorkOrderCheckIn;
  isCheckIn: boolean;
  isEdit: boolean;
  imageURI: any;
  imageFilePath: string;
  CheckInFilePrefix = 'CheckInScreenshot';
  CheckOutFilePrefix = 'CheckOutScreenshot';
  fileKey = 'CheckInCheckOutScreenshot';

  constructor(params: NavParams,
    private viewCtrl: ViewController,
    loadingCtrl: LoadingController,
    private transfer: FileTransfer,
    private camera: Camera,
    private app: AppService,
    public geo: GeoService,
    private workOrderService: WorkOrderService,
    private androidPermissions: AndroidPermissions,
    private locationAccuracy: LocationAccuracy,
    private fileService: FileService) {
    super(loadingCtrl);
    this.isCheckIn = params.get('isCheckIn');
    this.isEdit = params.get('isEdit');
    if (this.isEdit) {
      this.model = params.get('checkIn');
      if (this.isCheckIn) {
        this.updateImageFilePath(this.model.UDFsTransposed.NFSDLoginScreenshotFileName);
      }
      else {
        this.updateImageFilePath(this.model.UDFsTransposed.NFSDLogoutScreenshotFileName);
      }
    }
    else {
      if (this.isCheckIn) {
        this.model = new WorkOrderCheckIn();
        this.model.WorkOrderSID = params.get('workOrderSID');
      }
      else {
        this.model = params.get('lastCheckIn');
      }
      this.model.UDFsTransposed = new WorkOrderCheckInUDF();
    }
  }

  ngOnInit() {
    
  }

  cancel() {
    this.viewCtrl.dismiss({});
  }

  checkIn() {
    this.CheckLocatorStatusAndSave(true);
  }

  checkOut() {
    this.CheckLocatorStatusAndSave(false);
  }

  uploadCheckInFile() {
    this.uploadFile(true);
  }

  uploadCheckOutFile() {
    this.uploadFile(false);
  }

  update() {
    this.presentLoading();
    this.model.UDFsTransposed.WorkOrderCheckinSID = this.model.WorkOrderCheckinSID;
    this.workOrderService.SaveWorkOrderCheckInUDFs(this.model.UDFsTransposed).then(
      () => {
        this.dismissLoading();
        this.viewCtrl.dismiss();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("An error occurred while saving the information. Please try again.");
        this.dismissLoading();
      }
    );
  }

  isCheckInDisabled() {
    return !(this.model.UDFsTransposed.EIM
      && this.model.UDFsTransposed.NFSDLoginScreenshotFileName
      && this.model.UDFsTransposed.NFSDLoginTicket
      && this.imageFilePath
    );
  }

  isCheckOutDisabled() {
    return !(this.model.UDFsTransposed.NFSDLogoutScreenshotFileName
      && this.model.UDFsTransposed.NFSDLogoutTicket
      && this.imageFilePath
    );
  }

  getImage() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: this.camera.MediaType.PICTURE
    }

    this.camera.getPicture(options).then((imageData) => {
      this.imageURI = imageData;
      this.imageFilePath = null;
    }, (err) => {
      console.log(err);
      this.app.showErrorToast("An error occurred while getting the image. Please try again.");
    });
  }

  uploadFile(isCheckIn: boolean) {
    let loader = this.loadingCtrl.create({
      content: "Uploading..."
    });
    loader.present();
    const fileTransfer: FileTransferObject = this.transfer.create();
    let fileName = this.getFileName(isCheckIn);

    let options: FileUploadOptions = {
      fileKey: this.fileKey,
      fileName: fileName,
      chunkedMode: false,
      mimeType: this.fileService.getMimeType(fileName),
      headers: {
		"Authorization": "Bearer " + localStorage.getItem("token"),
        projectId: this.app.projectId,
        moduleId: this.app.moduleId,
      }
    }

    fileTransfer.upload(this.imageURI,
      this.app.config.apiEndpoint + `/WorkOrder/UploadCheckInFile?fileName=${fileName}&projectId=${this.app.projectId}`, options)
      .then((data) => {
        console.log(data + " Uploaded Successfully");
        this.updateImageFilePath(fileName);
        if (isCheckIn) {
          this.model.UDFsTransposed.NFSDLoginScreenshotFileName = fileName;
        }
        else {
          this.model.UDFsTransposed.NFSDLogoutScreenshotFileName = fileName;
        }
        loader.dismiss();
      }, (err) => {
        console.log(err);
        loader.dismiss();
        this.app.showErrorToast("An error occurred while uploading the screenshot. Please try again.");
      });
  }

  updateImageFilePath(fileName) {
    this.imageFilePath = this.app.config.apiEndpoint + `/WorkOrder/GetCheckInFile/?fileName=${fileName}&projectId=${this.app.projectId}`;
  }

  private getFileName(isCheckIn: boolean): string {
    return (isCheckIn ? this.CheckInFilePrefix : this.CheckOutFilePrefix) + this.model.WorkOrderSID + new Date().getDate()
      + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + '.jpg';
  }

  CheckLocatorStatusAndSave(isCheckIn: boolean) {
    if (this.app.isApp()) {
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
        result => {
          console.log('Has PERMISSION?', result.hasPermission);
          if (result.hasPermission) {
            this.CheckIfLocationOnAndSave(isCheckIn);
          } else {
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
              success => {
                if (success.hasPermission) {
                  this.CheckIfLocationOnAndSave(isCheckIn);
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
      this.SaveWorkOrderCheckIn(isCheckIn);
    }
  }

  CheckIfLocationOnAndSave(isCheckIn: boolean) {
    this.locationAccuracy.canRequest().then((canRequest: boolean) => {
      if (canRequest) {
        this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
          () => {
            console.log('Request successful');
            if (this.app.isiOS()) {
              this.app.showToast("Please enable Location Services and try again!");
            }
            else {
              this.SaveWorkOrderCheckIn(isCheckIn);
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
          this.SaveWorkOrderCheckIn(isCheckIn);
        }
        else {
          this.app.showErrorToast("An error occurred trying to check if Location is ON");
        }
      }
    });
  }

  SaveWorkOrderCheckIn(isCheckIn: boolean) {
    this.presentLoading();
    this.geo.getGeolocation().then((position) => {
      this.model.UDFsTransposed = this.model.UDFsTransposed;
      if (isCheckIn) {
        this.model.IsCheckedIn = true;
        this.model.CheckedInLatitude = position.coords.latitude;
        this.model.CheckedInLongitude = position.coords.longitude;
      }
      else {
        this.model.IsCheckedIn = false;
        this.model.CheckedOutLatitude = position.coords.latitude;
        this.model.CheckedOutLongitude = position.coords.longitude;
      }
      this.workOrderService.SaveWorkOrderCheckIn(this.model).then(
        response => {
          this.dismissLoading();
          let data = { checkinModel: response };
          this.viewCtrl.dismiss(data);
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
}