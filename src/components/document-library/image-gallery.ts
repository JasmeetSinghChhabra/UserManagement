import { Component, ViewChild, ElementRef } from '@angular/core';
import { AppService, FileService} from '../../services/services';
import { DocumentModel } from '../../models/models';
import { ModalController, Platform, NavParams, ViewController, Slides } from 'ionic-angular';

@Component({
    selector: 'image-gallery',
    templateUrl: 'image-gallery.html',
    providers: [FileService]
  })
export class ImageGallery {
    currentImageSrc: string= "";
    currentIndex: number;
    currentDocument: DocumentModel;
    images: DocumentModel[];
    @ViewChild('image') imageElement: ElementRef;
    imageEl: any;
    imageSrc: string;

    constructor(public platform: Platform, public params: NavParams, private app: AppService, public viewCtrl: ViewController,
      private fileService: FileService) {
      this.currentIndex = this.params.get('index');
      this.images = this.params.get('images');      
    }
  
    ngOnInit(): void {
      this.showImageAsync();       
    }
    
    showImage() {
      this.currentDocument = this.images[this.currentIndex];
      let id = this.currentDocument.Id;
      this.fileService.downloadImgSource(id, false).subscribe(src=>{
        this.currentImageSrc = src;
      });
    }

    showImageAsync() {
      this.currentDocument = this.images[this.currentIndex];
      let id = this.currentDocument.Id;
      this.fileService.downloadImgSource(id, false).subscribe(src=>{
        this.currentImageSrc = src;
      });
    }

    next() {
      this.currentIndex++;            
      this.showImageAsync();
    }

    previous() {
      this.currentIndex--;
      this.showImageAsync();
    }
    
    isNextDisabled(): boolean {
      if(this.currentIndex >= this.images.length - 1) {
        return true
      }
      return false;
    }

    isPreviousDisabled(): boolean {
      if(this.currentIndex <= 0) {
        return true
      }
      return false;
    }

    dismiss() {
      this.viewCtrl.dismiss();
    }
  }