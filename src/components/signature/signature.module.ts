import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Signature } from './signature';
import { SignaturePadModule } from 'angular2-signaturepad';

@NgModule({
  declarations: [
    Signature
  ],
  imports: [
    IonicPageModule.forChild(Signature),
    SignaturePadModule
  ],
  entryComponents: [
    Signature
  ],
  exports: [
    Signature
  ]
})
export class SignatureModule { }