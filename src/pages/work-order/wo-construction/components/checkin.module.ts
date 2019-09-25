import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CheckInForm } from './checkin-form';
import { SelectSearchableModule } from '../../../../components/select-searchable/select-searchable.module';

@NgModule({
  declarations: [
    CheckInForm
  ],
  imports: [
    IonicPageModule.forChild(CheckInForm), SelectSearchableModule
  ],
  exports: [
    CheckInForm
  ],
  entryComponents: [
    CheckInForm
  ]
})
export class CheckInModule { }