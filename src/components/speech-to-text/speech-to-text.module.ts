import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SpeechToTextComponent } from './speech-to-text';

@NgModule({
  declarations: [
    SpeechToTextComponent
  ],
  imports: [
    IonicPageModule.forChild(SpeechToTextComponent)
  ],
  exports: [
    SpeechToTextComponent
  ],
  entryComponents: [
    SpeechToTextComponent
  ]
})
export class SpeechToTextModule { }