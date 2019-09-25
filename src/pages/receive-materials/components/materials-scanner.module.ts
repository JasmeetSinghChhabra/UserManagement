import { NgModule, Optional, SkipSelf } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaterialsScanner } from './materials-scanner';
import { NexiusMaterialsScanner } from './nexiusmaterials-scanner';
import { CalloutScanner } from './callout-scanner';
import { SelectSearchableModule } from '../../../components/select-searchable/select-searchable.module';


@NgModule({
  declarations: [
    MaterialsScanner,
    NexiusMaterialsScanner
    //CalloutScanner
  ],
  imports: [
    IonicPageModule.forChild(MaterialsScanner),
    IonicPageModule.forChild(NexiusMaterialsScanner),
    //IonicPageModule.forChild(CalloutScanner),
    SelectSearchableModule
    
  ],
  exports: [
    MaterialsScanner,
    NexiusMaterialsScanner
    //CalloutScanner
  ],
  entryComponents: [
    MaterialsScanner,
    MaterialsScanner
    //CalloutScanner
  ]
})
export class MaterialsScannerModule { }