import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicApp, IonicModule } from 'ionic-angular';
import { Storage, IonicStorageModule } from '@ionic/storage';
import { AppCenterAnalytics } from '@ionic-native/app-center-analytics';
import { AppCenterCrashes } from '@ionic-native/app-center-crashes';
import { AppCenterPush } from '@ionic-native/app-center-push';
import { MyApp } from './app.component';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { VideoCapturePlus } from '@ionic-native/video-capture-plus';
import { VideoEditor } from '@ionic-native/video-editor';
import { LocalNotifications } from '@ionic-native/local-notifications';

/***** Main entry pages *****/
import { Home } from '../pages/home/home';
import { About } from '../pages/about/about';
import { Accuv } from '../pages/accuv/accuv';
import { WorkOrderHome } from '../pages/work-order/work-order-home';
import { Demo } from '../pages/demo/demo';
import { RMHome } from '../pages/receive-materials/rm-home'

/***** Components modules *****/
import { SpeechToTextModule } from '../components/speech-to-text/speech-to-text.module';
import { AudioNoteModule } from '../components/audio-note/audio-note.module';
import { IonicAudioModule, WebAudioProvider, CordovaMediaProvider } from 'ionic-audio';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { PowerBIModule } from '../components/power-bi/power-bi.module';
import { InAppBrowser } from '@ionic-native/in-app-browser';

/***** AccuV modules *****/
import { CoreModule } from './core.module';
import { DfrModule } from '../pages/daily-field-report/dfr.module';
import { DviModule } from '../pages/daily-vehicle-inspection/dvi.module';
import { WorkOrderCONModule } from '../pages/work-order/wo-construction/wo-con.module';
import { WorkOrderOFModule } from '../pages/work-order/wo-order-fulfillment/wo-of.module';
import { DashboardModule } from '../pages/dashboard/dashboard.module';
import { PowaModule } from '../pages/po-workflow-approvals/powa.module';
import { VideoQaModule } from '../pages/video-qa/video-qa.module';
import { WarehouseCheckInModule } from '../pages/warehouse-check-in/warehouse-check-in.module';
import { ReceiveMaterialsModule } from '../pages/receive-materials/receive-materials.module';
import { ChatEngineModule } from '../pages/chat-engine/chat-engine.module';

export function audioProviderFactory() {
  return (window.hasOwnProperty('cordova')) ? new CordovaMediaProvider() : new WebAudioProvider();
}

@NgModule({
  declarations: [
    MyApp,
    Home, 
    About,
    Accuv,
    WorkOrderHome,
    RMHome,
    Demo
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    HttpModule,
    CoreModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    IonicAudioModule.forRoot((audioProviderFactory)),
    PowerBIModule.forRoot(),
    AudioNoteModule,
    SpeechToTextModule,
    LazyLoadImageModule,
    DfrModule,
    DviModule,
    WorkOrderCONModule,
    WorkOrderOFModule,
    DashboardModule,
    PowaModule,
    VideoQaModule,
    WarehouseCheckInModule,
    ReceiveMaterialsModule,
    ChatEngineModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Home, 
    About,
    Accuv,
    WorkOrderHome,
    RMHome,
    Demo
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AppCenterAnalytics,
    AppCenterCrashes,
    AppCenterPush,
    LocationAccuracy,
    AndroidPermissions,
    VideoCapturePlus,
    VideoEditor,
     ScreenOrientation,
     LocalNotifications,
     InAppBrowser,
    Diagnostic
  ]
})
export class AppModule { }
