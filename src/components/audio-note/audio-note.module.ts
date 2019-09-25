import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AudioNoteComponent } from './audio-note';
import { IonicAudioModule, WebAudioProvider, CordovaMediaProvider } from 'ionic-audio';

export function audioProviderFactory() {
  return (window.hasOwnProperty('cordova')) ? new CordovaMediaProvider() : new WebAudioProvider();
}

@NgModule({
  declarations: [
    AudioNoteComponent
  ],
  imports: [
    IonicAudioModule.forRoot(audioProviderFactory),
    IonicPageModule.forChild(AudioNoteComponent),
  ],
  exports: [
    AudioNoteComponent
  ],
  entryComponents: [
    AudioNoteComponent
  ]
})
export class AudioNoteModule { }