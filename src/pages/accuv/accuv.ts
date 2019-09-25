import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, NavController, ToastController, Events, Nav } from 'ionic-angular';
import { AuthService, AppService } from '../../services/services';
import { AppConfig } from '../../app/config/app.config'
import { AppVersion } from '@ionic-native/app-version';
import { BasePage } from '../base.page';

@Component({
  selector: 'accuv',
  templateUrl: 'accuv.html'
})
export class Accuv extends BasePage {

  @ViewChild(Nav) nav: Nav;
  appVersionNumber: any;
  appName: any;
  appPackage: any;

  constructor(loadingCtrl: LoadingController) {
    super(loadingCtrl);
  }
  
  ngOnInit(): void {
  }

}
