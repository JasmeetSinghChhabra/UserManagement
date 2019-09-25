import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { AppService } from '../common/app.service';
import { FileOpener } from '@ionic-native/file-opener';
import { File } from '@ionic-native/file';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { DocumentModel } from '../../models/models';
import * as mime from 'mime';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';

interface Dictionary < T > {
  [K: string]: T;
}

@Injectable()
export class FileService {

  public documentIcons: Dictionary<string> = {
    "pdf": "pdf1.svg",
    "xlsx": "excel1.svg",
    "xls": "excel1.svg",
    "csv": "excel1.svg",
    "doc": "word1.svg",
    "docx": "word1.svg",
    "zip": "zip1.svg",
    "mp4": "video1.svg",
    "other": "file1.svg"
  };
  public allowedPhotoTypes: string[] = ["image/jpeg", "image/png", "image/svg+xml", "image/tiff"];

  constructor(private fileOpener: FileOpener, private file: File, private transfer: FileTransfer, 
    private alertCtrl: AlertController, private app: AppService, private http: HttpClient, private sanitizer: DomSanitizer) {

  }

  public getMimeType(fileName: string): string {
    let mimeType = mime.getType(fileName);
    return mimeType;
  }

  public getExtension(fileName: string): string {
    let mimeType = this.getMimeType(fileName);
    let extension = mime.getExtension(mimeType);
    return extension;
  }

  public createDocument(doc: any, imgSrc: string): DocumentModel { 
      let document = new DocumentModel();
      document.ImageSrc = imgSrc
      let mimeType = mime.getType(doc.FileName);
      document.Id = doc.Id;
      document.FileName = doc.FileName;
      document.DocumentId = doc.DeliverableId;
      document.DocumentName = doc.ContainerName;
      document.JobNumber = doc.JobNumber;
      document.MimeType = mimeType;
      document.Extension = mime.getExtens
      document.IsViewable = this.isViewable(mimeType);
      document.IsPicture = this.isPicture(mimeType); 
      return document;
  }

  public getFileIcon(fileName: string, id: number) {
    let mimeType = this.getMimeType(fileName);
    let extension = mime.getExtension(mimeType);
    let icon = this.documentIcons[extension];
    if (!icon) {
      icon = this.documentIcons['other'];
    }
    return "assets/images/components/" + icon;
  }
  
  isViewable(mimeType): boolean {
    
    if(this.allowedPhotoTypes.find(x => x === mimeType)) { //|| mimeType == "application/pdf"
      return true;
    }

    return false;
  }
  
  isPicture(mimeType): boolean {    
    if(this.allowedPhotoTypes.find(x => x === mimeType)) {
      return true;
    }

    return false;
  }

  public getStorageDirectory(): string {
    let storageDirectory;
    if (this.app.platform.is('ios')) {
      storageDirectory = this.file.documentsDirectory;
    }
    else if(this.app.platform.is('android')) {
      //storageDirectory = this.file.externalRootDirectory + '/Download/';
      storageDirectory = this.file.externalDataDirectory;
    }
    return storageDirectory;
  }

  public downloadImgSource(id:number, thumbnail: boolean): Observable<any>{
    return this.http.get(
      `${this.app.config.odataEndpoint}/UploadedDocuments(${id})/$value?inline=true&thumbnail=${thumbnail}&projectId=${this.app.projectId}`,
      { 
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem("token"), 
        },
        responseType: 'blob'
      }
    )
    .map(blob => {
      var urlCreator = window.URL;
      return this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(blob));
    })
  }

  public downloadFile(key: number, fileName: string): Promise<any> {
    //FileTransfer plugin implementation
    let fileTransfer: FileTransferObject = this.transfer.create();

    let options = {
        headers: {
        Authorization: 'Bearer ' + localStorage.getItem("token")
        }
    };
    
    let storageDirectory = this.getStorageDirectory();

    let apiEndPoint = this.app.config.apiEndpoint;
    // if(!this.app.config.isProduction){
    //   apiEndPoint = apiEndPoint.replace("https", "http");
    // }
    return fileTransfer.download(apiEndPoint + '/WorkOrder/DownloadFile?key=' + key + '&projectId=' + this.app.projectId, storageDirectory + fileName, true, options);    
  }

  public retrieveFile(fileName: string) {    
    let storageDirectory = this.getStorageDirectory();
    this.file.checkFile(storageDirectory, fileName)
      .then(() => {

        const alertSuccess = this.alertCtrl.create({
          title: `File retrieval Succeeded!`,
          subTitle: `${fileName} was successfully retrieved from: ${storageDirectory}`,
          buttons: ['Ok']
        });

        return alertSuccess.present();

      })
      .catch((err) => {

        const alertFailure = this.alertCtrl.create({
          title: `File retrieval Failed!`,
          subTitle: `${fileName} was not successfully retrieved. Error Code: ${err.code}`,
          buttons: ['Ok']
        });

        return alertFailure.present();

      });
  }

  public openFile(filePath: string): Promise <any> {
    console.log(`Opening file ${filePath}`);
    let mimeType = mime.getType(filePath);
    console.log(`Mime type: ${mimeType}`);
    return this.fileOpener.open(filePath, mimeType);
  }
}
