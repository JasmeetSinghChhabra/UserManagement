import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaterialPicker } from './material-picker';
import { LotScanner } from './lot-scanner';
import { SerialNumberScanner } from './serial-number-scanner';

@NgModule({
  declarations: [
    MaterialPicker,
    LotScanner,
    SerialNumberScanner
  ],
  imports: [
    IonicPageModule.forChild(MaterialPicker),
    IonicPageModule.forChild(LotScanner),
    IonicPageModule.forChild(SerialNumberScanner)
  ],
  exports: [
    MaterialPicker,
    LotScanner,
    SerialNumberScanner
  ],
  entryComponents: [
    MaterialPicker,
    LotScanner,
    SerialNumberScanner
  ]
})
export class MaterialPickerModule { }