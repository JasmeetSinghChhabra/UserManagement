import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { MaterialPickList } from './material-pick-list';
import { GcPickPage } from './gc-pick'
import { WorkOrderOFFormNew } from './wo-of-form-new';
import { SelectSearchableModule } from '../../../components/select-searchable/select-searchable.module';
import { PipesModule } from '../../../utils/pipes/pipes.module';
import { CoreModule } from '../../../app/core.module';
import { WorkOrderOFListTabs } from './wo-of-list-tabs';
import { WorkOrderOFList } from './wo-of-list';
import { WorkOrderOFAssign } from './wo-of-assign';
import { Signature } from './signature-modal';
import { PickUpQty } from './pickup-qty-modal';
import { SignaturePadModule } from 'angular2-signaturepad';
import { MaterialPickerModule } from './components/material-picker.module';

@NgModule({
  imports: [ CommonModule, IonicModule, PipesModule, SelectSearchableModule, CoreModule, MaterialPickerModule, SignaturePadModule ],
  declarations: [ WorkOrderOFListTabs, WorkOrderOFList, MaterialPickList, GcPickPage, WorkOrderOFFormNew, WorkOrderOFAssign, Signature, PickUpQty ],
  exports: [ WorkOrderOFListTabs, WorkOrderOFList, MaterialPickList, GcPickPage, WorkOrderOFFormNew, WorkOrderOFAssign, Signature, PickUpQty ],
  entryComponents: [ WorkOrderOFListTabs, WorkOrderOFList, MaterialPickList, GcPickPage, WorkOrderOFFormNew, WorkOrderOFAssign, Signature, PickUpQty ]
})
export class WorkOrderOFModule {
  constructor (@Optional() @SkipSelf() parentModule: WorkOrderOFModule) {
    if (parentModule) {
      throw new Error('WorkOrderOFModule is already loaded. Import it in the AppModule only');
    }
  }
}