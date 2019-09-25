import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, NavController, ToastController, Events, Nav } from 'ionic-angular';
import { AuthService, AppService } from '../../services/services';
import { AppConfig } from '../../app/config/app.config'
import { AppVersion } from '@ionic-native/app-version';
import { BasePage } from '../base.page';

@Component({
  selector: 'about',
  templateUrl: 'about.html'
})
export class About extends BasePage {

  @ViewChild(Nav) nav: Nav;
  appVersionNumber: any;
  appName: any;
  appPackage: any;

  constructor(loadingCtrl: LoadingController, private navCtrl: NavController, private http: Http,
    private toastCtrl: ToastController, public auth: AuthService, private events: Events, private appService: AppService,
    private appConfig: AppConfig, private appVersion: AppVersion) {
    super(loadingCtrl);
  }
  
  ngOnInit(): void {
    if (this.appService.isApp()) {
      this.appVersion.getVersionNumber().then(versionNumber => {
        this.appVersionNumber = versionNumber;
        this.appVersion.getVersionCode().then(versionCode => {
          if(versionCode){
            this.appVersionNumber = this.appVersionNumber + " (" + versionCode + ")";
          }
        });      
      });
      this.appVersion.getAppName().then(name => {
        this.appName = name;
      });
      this.appVersion.getPackageName().then(packageName => {
        this.appPackage = packageName;
      });
    } else {
      this.appVersionNumber = "Oops! This works only in a device or emulator";
      this.appName = "Oops! This works only in a device or emulator";
      this.appPackage = "Oops! This works only in a device or emulator";
    }

  }

}
