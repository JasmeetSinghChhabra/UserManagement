import { ModuleWithProviders, NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { Storage } from '@ionic/storage';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Media } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { Camera } from '@ionic-native/camera';
import { AppVersion } from '@ionic-native/app-version';
import { SimpleTimer } from 'ng2-simple-timer';
import { Geolocation } from '@ionic-native/geolocation';
import { FileOpener } from '@ionic-native/file-opener';
import { Diagnostic } from '@ionic-native/diagnostic';
/***** Core app services and helpers *****/
import { GeoService, AppService, Api, AuthService, SignatureService, Settings, ChatEngineService } from '../services/services';
import { ODataConfiguration, ODataServiceFactory } from '../services/odata/odata';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Http, RequestOptions } from '@angular/http';
import { Helper } from '../utils/utils';

/***** Core Components *****/
import { AppConfig } from './config/app.config';
import { NotImplemented } from '../components/not-implemented';
import { FaIconComponent } from "../components/fa-icon/fa-icon.component";
import { ProgramSelector } from '../components/program-selector/program-selector';
import { ExpandableComponent } from '../components/expandable/expandable';
import { AccuVHttp, AccuVErrorHandler, RequestOptionsService, RequestInterceptor } from './extensions/extensions';
import { VideoChatComponent } from '../components/video-chat/video-chat';

export function provideSettings(storage: Storage) {
    /**
     * The Settings provider takes a set of default settings for your app.
     *
     * You can add new settings options at any time. Once the settings are saved,
     * these values will not overwrite the saved values (this can be done manually if desired).
     */
    return new Settings(storage, {
      test1: true,
      test2: 'Ionitron J. Framework'
    });
  }

@NgModule({
  imports: [ CommonModule, IonicModule ],
  declarations: [ ProgramSelector, ExpandableComponent, FaIconComponent, NotImplemented ],
  exports: [ ProgramSelector, ExpandableComponent, FaIconComponent ],
  entryComponents: [ ProgramSelector, NotImplemented ],
  providers: [
      GeoService, 
      AppService, 
      Api, 
      AuthService, 
      SignatureService,
      ODataConfiguration,
      ODataServiceFactory,
      AndroidPermissions,
      Diagnostic,
      AppConfig,      
      SpeechRecognition,
      Media,
      File,
      AppVersion,
      SimpleTimer,
      FileTransfer,
      Camera,
      Geolocation,
      FileOpener,
      ChatEngineService,
      VideoChatComponent,
      { provide: Settings, useFactory: provideSettings, deps: [Storage] },
      { provide: Http, useClass: AccuVHttp },
      { provide: RequestOptions, useClass: RequestOptionsService },
      { provide: HttpClient, useClass: HttpClient },
      { provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true},
      { provide: ErrorHandler, useClass: ErrorHandler },
      { provide: Helper, useClass: Helper }
    ]
})
export class CoreModule {
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }

  // static forRoot(config: UserServiceConfig): ModuleWithProviders {
  //   return {
  //     ngModule: CoreModule,
  //     providers: [
  //       {provide: UserServiceConfig, useValue: config }
  //     ]
  //   };
  // }
}