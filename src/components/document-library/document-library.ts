import { Component, ViewChild, ElementRef, Renderer, EventEmitter, Input, Output, OnDestroy, OnChanges, Optional, SimpleChanges } from '@angular/core';
import { ViewController, LoadingController, Events, NavParams, AlertController, ModalController } from 'ionic-angular';
import { AppService, FileService } from '../../services/services';
import { DocumentModel } from '../../models/models';
import { ImageGallery } from './image-gallery';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'document-library',
  templateUrl: 'document-library.html'
})
export class DocumentLibrary extends BaseComponent {

  private _items: DocumentModel[];
  private _images: DocumentModel[];
  private documentsView: string;
  private scrollContainer: any;
  
  get documents(): DocumentModel[] {
    return this._items;
  }

  @Input('documents')
  set documents(items: DocumentModel[]) {
    this._items = items;
    this._images = this.filterImages(items);
  }

  constructor(params: NavParams, private app: AppService, public viewCtrl: ViewController, private alertCtrl: AlertController,
    public loadingCtrl: LoadingController, private events: Events, private fileService: FileService, private modalCtrl: ModalController) {
    super(loadingCtrl);
    this.documentsView = "grid";
    
    this.scrollContainer = document.getElementsByClassName('scroll-content')[document.getElementsByClassName('scroll-content').length-1];

  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  ngOnInit(): void {
  
  }

  download(id: number, fileName: string): void {     
    //Make sure this is on a device, not an emulation (e.g. chrome tools device mode)
    if(!this.app.platform.is('cordova')) {
      return;
    }

    this.presentLoading("Downloading...");
    console.log(`Downloading file ${fileName}`);
    this.fileService.downloadFile(id, fileName).then(
     (entry) => {      
       this.dismissLoading();
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
       this.dismissLoading();
       this.app.showErrorToast("Oops! An error has occurred downloading file: " +  fileName);
     }
    );
  }

  downloadFile(id: number, fileName: string): void {
    //TODO: implement download with http directly
    //return this.http.get(this.app.config.apiEndpoint + '/WorkOrder/DownloadFile?key=' + key + '&projectId=' + this.app.projectId, options).toPromise();
  }

  view(id: number, fileName: string): void {
    //Only available for pictures for now
    let modal = this.modalCtrl.create(ImageGallery, { 
      index: this.getImageIndex(id),
      images: this._images
    });
    modal.present();
  }

  viewOrDownload(document: DocumentModel) : void {
    if(document.IsViewable){
      this.view(document.Id, document.FileName);
    } else {
      this.download(document.Id, document.FileName);
    }
  }

  filterImages(items: DocumentModel[]): DocumentModel[] {
    let images:  DocumentModel[] = [];
    for (let i = 0; i < items.length; i++) {
      let doc = this._items[i];
      if(doc.IsPicture) {
        images.push(this._items[i]);
      }
    }
    return images;
  }

  getImageIndex(id: number): number {
    let index = this._images.findIndex(i => i.Id==id);
    return index;
  }

}
