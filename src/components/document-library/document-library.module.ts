import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DocumentLibrary } from './document-library';
import { ImageGallery } from './image-gallery';
import { IonicImageViewerModule } from 'ionic-img-viewer';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  declarations: [
    DocumentLibrary,
    ImageGallery
  ],
  imports: [
    IonicPageModule.forChild(DocumentLibrary),
    IonicImageViewerModule,
    LazyLoadImageModule
  ],
  exports: [
    DocumentLibrary,
    ImageGallery
  ],
  entryComponents: [
    DocumentLibrary,
    ImageGallery
  ]
})
export class DocumentLibraryModule { }