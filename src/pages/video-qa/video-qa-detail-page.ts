import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ModalController } from 'ionic-angular';
import { AppService, WorkOrderService, FileService, AuthService, GeoService } from '../../services/services';
import { Home } from '../home/home';
import { VQAItem } from '../../models/models';
import { VQAUploadedVideo, VQAStatus, VQAStatusBE } from '../../models/video-qa/vqa.model';
import { CameraOptions, Camera, PictureSourceType } from '@ionic-native/camera';
import { VideoCapturePlus, VideoCapturePlusOptions, MediaFile } from '@ionic-native/video-capture-plus';
import { GetVideoInfoOptions, VideoEditor, CreateThumbnailOptions } from '@ionic-native/video-editor';
import { FileTransferObject, FileTransfer, FileUploadOptions } from '@ionic-native/file-transfer';
import { File, FileEntry } from '@ionic-native/file';
import * as watermark from 'watermarkjs';
import { FullDateTimeFormatPipe, Constants } from '../../utils/utils';
import { DatePipe } from '@angular/common';
import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications';
import { AndroidPermissions } from '@ionic-native/android-permissions';
declare var window;

/**
 * Generated class for the VideoQADetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'video-qa-detail-page',
  templateUrl: 'video-qa-detail-page.html',
  providers: [WorkOrderService, FileService]
})
export class VideoQADetailPage {

  checkitem: VQAItem;
  videoList: VQAUploadedVideo[];
  datePipe: DatePipe = null;
  uploadNotificationId: number = 34067165;
  woSID: number;
  woType: number;

  constructor(public navParams: NavParams, 
    loadingCtrl: LoadingController, 
    private workOrderService: WorkOrderService,
    private app: AppService,
    private modalCtrl: ModalController,
    private camera: Camera,
    private mediaCapture: VideoCapturePlus,
    private videoEditor: VideoEditor,
    private transfer: FileTransfer,
    private fileService: FileService,
    private auth: AuthService,
    private file: File,
    private geo: GeoService,
    private localNotifications: LocalNotifications,
    private androidPermissions: AndroidPermissions) {

      this.checkitem = navParams.get('checkitem');
      this.woSID = navParams.get('woSID');
      this.woType = navParams.get('woType');
      this.datePipe = new DatePipe("en-US");
      
      this.videoList = [];
      this.app.presentLoading();
      this.getUploadedVideosForJobApplicableAction(null);

      if (this.app.isApp()) {
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
          result => {
            if (!result.hasPermission) {
              this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
                success => {
                  if (!success.hasPermission) {
                    this.app.showErrorToast("In order to be able to upload media, you need to grant access to the phone's storage.");
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
      }
  }

  doRefresh(refresher) {
    this.getUploadedVideosForJobApplicableAction(refresher);
  }

  getUploadedVideosForJobApplicableAction(refresher) {
    this.workOrderService.GetUploadedMediaForVQAJobChecklist(this.checkitem.JobApplicableActionSID, this.woSID).then(result => {
        this.videoList = [];
        this.app.dismissLoading();
        result.forEach(element => {
          element.UploadProgress = 100;
          if (element.Thumbnail){
            element.Thumbnail = this.app.config.endpoint + "/" + element.Thumbnail;
          }
        });
        this.videoList = result.sort((a: VQAUploadedVideo, b: VQAUploadedVideo) => a.LastModifiedDate > b.LastModifiedDate ? -1 : 1) as VQAUploadedVideo[];

        if (this.videoList && this.videoList.length > 0){
          this.checkitem.Status = this.videoList[0].Status;
        }
        console.log(result);
        if (refresher){
          refresher.complete();
        }
      }).catch(e=>{
        this.app.dismissLoading();
        console.log(e);
        if (refresher){
          refresher.complete();
        }
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad VideoQADetailPage');
  }

  getMedia(sourceType: number, mediaType: number){
    if (sourceType == 2){
      this.getVideo();
    } else {
      this.getImage(sourceType, mediaType);
    }
  }

  getImage(sourceType: number, mediaType: number) {
    const options: CameraOptions = {
      quality: 80,
      targetWidth: 1000,
      targetHeight: 1000,
      destinationType: this.camera.DestinationType.NATIVE_URI,
      sourceType: sourceType,
      mediaType: mediaType
    }

    this.camera.getPicture(options).then((mediaData: string) => {
      console.log("Image native uri: " + mediaData);
     
      //this.scheduleUploadNotification();

      let fileName;
      if (sourceType == PictureSourceType.CAMERA || (mediaData.indexOf(".jpg") != -1 || mediaData.indexOf(".jpeg") != -1 || mediaData.indexOf(".png") != -1
      || mediaData.indexOf(".JPG") != -1 || mediaData.indexOf(".JPEG") != -1 || mediaData.indexOf(".PNG") != -1)){
        if (this.app.programFeatures.vqa_picture){
          fileName = this.getFileName('.jpg');
          this.startUpload(mediaData, fileName);
        } else {
          this.app.showErrorToast("Pictures are not allowed as part of this program.");
        }
      } else {
        if (mediaData.indexOf(".MOV") != -1 || mediaData.indexOf(".mov") != -1 || mediaData.indexOf(".MP4") != -1 || mediaData.indexOf(".mp4") != -1){
          if (this.app.programFeatures.vqa_video){
            if ( mediaData.indexOf(".MOV") != -1 || mediaData.indexOf(".mov") != -1 ){
                fileName = this.getFileName('.mov');
                this.startUpload(mediaData, fileName);
            } else {
              fileName = this.getFileName('.mp4');
              this.startUpload(mediaData, fileName);
            }
          } else {
            this.app.showErrorToast("Videos are not allowed as part of this program.");
          }
        }
      }
    

    }, (err) => {
      console.log(err);
    });
  }

  startUpload(mediaData: string, fileName: string){
    let fileURI = mediaData;
    this.app.showToast("Your media is being uploaded in the background...");
    let vQAUploadedVideo = this.addNewItemToList(fileName);
    this.uploadFile(fileURI, fileName, vQAUploadedVideo);
  }

  getVideo(){
    const options: VideoCapturePlusOptions = {
      limit: 1,
      highquality: true
    }
    this.mediaCapture.captureVideo(options)
      .then(
        (data: MediaFile[]) => {
          let capturedFile = data[0];
          let fileNameCaptured = capturedFile.name;
          
          let fileName = this.getFileName('.mp4');
          let vQAUploadedVideo = this.addNewItemToList(fileName);

          this.app.presentLoading("Preparing video for upload...");

          //this.scheduleUploadNotification();

          this.videoEditor.transcodeVideo(
              {
                  fileUri: capturedFile.fullPath,
                  outputFileName: "comp_" + fileNameCaptured.replace(".mov", ".mp4").replace(".MOV", ".MP4"),
                  outputFileType: this.videoEditor.OutputFileType.MPEG4,
                  optimizeForNetworkUse: this.videoEditor.OptimizeForNetworkUse.YES,
                  saveToLibrary: true,
                  deleteInputFile: true,
                  videoBitrate: 8000000,
                  audioChannels: 2,
                  audioSampleRate: 44100,
                  audioBitrate: 128000,
                  progress: function(info) {
                      console.log('transcodeVideo progress callback, info: ' + info);
                  }
              }
          ).then(result=>{
            this.app.dismissLoading();
            this.app.showToast("Your media is being uploaded in the background...");
            let fileURI = "file://" + result;
            this.uploadFile(fileURI, fileName, vQAUploadedVideo);
          }).catch(e=>{
            this.app.dismissLoading();
            console.log(e);
             //this.showErrorNotification();
            this.app.showErrorToast("An error occurred while preparing the video for upload. Please try again.");
            this.removeItemFromList(vQAUploadedVideo);
          });
        },
        err => console.error(err)
      );
  }

  uploadFile(fileURI: string, fileName: string, vQAUploadedVideo: VQAUploadedVideo) {
    const fileTransfer: FileTransferObject = this.transfer.create();

    let options: FileUploadOptions = {
      fileKey: "Stream",
      fileName: fileName,
      chunkedMode: false,
      mimeType: this.fileService.getMimeType(fileName),
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token"),
        projectId: this.app.projectId,
        moduleId: this.app.moduleId,
      },
      params: {
        Lat: this.geo.position ? this.geo.position.coords.latitude.toString() : "",
        Long: this.geo.position ? this.geo.position.coords.longitude.toString() : ""
      }
    }

    //this.updateUploadNotification();

    fileTransfer.onProgress((progressEvent) => {
      var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
      console.log("Uploading... " + perc + "%" );
      //this.uploadNotificationStep(perc);
      vQAUploadedVideo.UploadProgress = perc;
    });

    fileTransfer.upload(fileURI,
      this.app.config.apiEndpoint + `/FieldServiceManagement/UploadVQAMedia?fileName=${fileName}&projectId=${this.app.projectId}&vqaJobChecklistSID=${this.checkitem.JobApplicableActionSID}&workOrderSID=${this.woSID}&workOrderType=${this.woType}`, options, true)
      .then((data) => {
        this.app.showSuccessToast("File uploaded successfully!");
        vQAUploadedVideo.UploadProgress = 100;
        this.checkitem.Status = VQAStatusBE.Uploaded;
        //this.showSuccessNotification();
      }, (err) => {
        console.log(err);
        this.app.showErrorToast("An error occurred while uploading the file. Please try again.");
        //this.showErrorNotification();
        this.removeItemFromList(vQAUploadedVideo);
      });
  }

  scheduleUploadNotification(){
    this.localNotifications.schedule( {
      id: this.checkitem.JobApplicableActionSID,
      title: "Uploading media...",
      text: this.checkitem.Name,
      vibrate: false,
      sound: null,
      launch: false,
      wakeup: false,
      sticky: true,
      autoClear: true,
      color: "00398B",
      progressBar: {
        value: 0,
        indeterminate: true  
      }
    });
  }

  updateUploadNotification(){
    this.localNotifications.update({
      id: this.checkitem.JobApplicableActionSID,
      progressBar: { 
        value: 0,
        indeterminate: false 
      }
    })
  }

  addNewItemToList(fileName): VQAUploadedVideo{
    let vQAUploadedVideo = new VQAUploadedVideo();
    vQAUploadedVideo.FileName = fileName;
    vQAUploadedVideo.LastModifiedUserId = this.auth.userInfo.UserId;
    vQAUploadedVideo.Status = VQAStatusBE.Uploaded;
    vQAUploadedVideo.LastModifiedDate = new Date();
    vQAUploadedVideo.UploadProgress = 0;
    vQAUploadedVideo.MediaFileSID = (new Date()).getMilliseconds();
    this.videoList.unshift(vQAUploadedVideo);
    return vQAUploadedVideo;
  }

  removeItemFromList(vQAUploadedVideo: VQAUploadedVideo){
    this.videoList.forEach( (item, index) => {
      if (item.MediaFileSID == vQAUploadedVideo.MediaFileSID) this.videoList.splice(index,1);
    });
  }

  uploadNotificationStep(perc){
    this.localNotifications.update({
      id: this.checkitem.JobApplicableActionSID,
      progressBar: {
        value: perc 
      }
    });
  }

  showSuccessNotification(){
    this.localNotifications.cancel(this.checkitem.JobApplicableActionSID).then(() => {
      this.localNotifications.schedule({
        id: this.checkitem.JobApplicableActionSID,
        title: "Media successfully uploaded for " + this.checkitem.Name,
        color: "18873b",
        progressBar: {
          value: 100,
          indeterminate: false
        }
      });
    });
  }

  showErrorNotification(){
    this.localNotifications.cancel(this.checkitem.JobApplicableActionSID).then(() => {
      this.localNotifications.schedule({
        id: this.checkitem.JobApplicableActionSID,
        title: "An error occurred trying to upload media for for " + this.checkitem.Name,
        color: "ba1424",
        progressBar: {
          value: 100,
          indeterminate: false
        }
      });
    });
  }

  private getFileName(extension): string {
      return "WorkOrder_Media_" + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + extension;
  }
}
