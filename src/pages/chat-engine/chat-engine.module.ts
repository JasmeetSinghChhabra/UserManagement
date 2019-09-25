import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
//import { ChatEngineHome } from './chat-engine-home';
import { VideoChatComponent } from '../../components/video-chat/video-chat';

@NgModule({
  imports: [ CommonModule, IonicModule ],
  declarations: [ VideoChatComponent ],
  exports: [ VideoChatComponent ],
  entryComponents: [ VideoChatComponent ]
})
export class ChatEngineModule {

  constructor (@Optional() @SkipSelf() parentModule: ChatEngineModule) {
    if (parentModule) {
      throw new Error('ChatEngineModule is already loaded. Import it in the AppModule only');
    }
  }
}