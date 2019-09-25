import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { AlertController, ToastController, LoadingController, Loading, Platform, App, NavController } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';
import { AppConfig } from '../../app/config/app.config';
import { AppCenterAnalytics, StringMap } from '@ionic-native/app-center-analytics';
import 'rxjs/add/operator/toPromise';
import compareVersion  from 'compare-versions';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from './api.service';
import { ProgramFeatures } from '../../models/common/features.model';

@Injectable()
export class AppService {
  projectName: string;
  projectId: string;
  moduleId: number;
  subModules: any[];
  programs: any[];
  loading: Loading;
  timeoutDialogShown: boolean;
  modulesPermission: Array<{  moduleId: number, access: boolean }> = [];
  programFeatures: ProgramFeatures;

  constructor(private http: HttpClient, public alertCtrl: AlertController, public toastCtrl: ToastController,
    public config: AppConfig, public loadingCtrl: LoadingController, public platform: Platform,
    public app: App, private appCenterAnalytics: AppCenterAnalytics, private appVersion: AppVersion) {
    this.projectName = "";
    this.projectId = "";
    this.timeoutDialogShown = false;
    this.subModules = [];
  }

  //Menu
  getPrograms():Promise<any> {
    const token = localStorage.getItem("token");
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
    return this.http.get(this.config.apiEndpoint + "/application/GetPrograms", {headers})
    .toPromise()
    .then(res => {
      this.programs = res as any[];
      return this.programs;
    })
    .catch(this.handlePromiseError);
  }

  getMenuItems(): Promise<any> {
    const token = localStorage.getItem("token");
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
    return this.http.get(this.config.apiEndpoint + `/application/GetMenuItems?projectId=${this.projectId}`, {headers})
      .toPromise()
      .then(res => {
        let menuItems = res as any;
        return menuItems;
      })
      .catch(this.handlePromiseError);
  }

  clearAppData(){
    this.projectName = null,
    this.projectId= null;
    this.moduleId = 0;
    this.subModules = [];
    this.programs= null;
    this.modulesPermission= [];
  }

  checkAppUpdate(): Promise <UpdateModel> {
    // Only check for updates in a real device
    if(!this.isApp()) {
      return new Promise<UpdateModel>(resolve => {
        let um = new UpdateModel();
        return resolve(um);
      })
    }
    let promise = new Promise<UpdateModel>(resolve => this.getLatestVersion().then(latestRelease => {
      this.getPackageVersion().then(versionNumber => {
        this.getPackageVersionCode().then(versionCode => {
          this.getPackageName().then(packageName => {
            let updateModel = new UpdateModel(versionNumber, versionCode.toString(), latestRelease.short_version, latestRelease.version);
            updateModel.InstallUrl = latestRelease.release_notes_url;

            if(packageName != latestRelease.bundle_identifier) {
              // This is not the same bundle, so don't check for updates
              return resolve(updateModel);
            }

            let versionComparision = compareVersion(updateModel.newVersion, updateModel.oldVersion);
            if (versionComparision == 1) {
              updateModel.Update = true;
              return resolve(updateModel);
            } else if (versionComparision == 0) {
              let codeComparision = compareVersion(updateModel.newVersionCode, updateModel.oldVersionCode);
              if (codeComparision == 1) {
                updateModel.Update = true;
                return resolve(updateModel);
              }
            }
            return resolve(updateModel);
          });
        });
      });
    }));
    return promise;
  }

  getLatestVersion(): Promise<any> {    
    return this.http.get(this.config.appCenterApi + "/public/sdk/apps/" + this.getAppSecret() + "/distribution_groups/" + this.getDistributionGroup() + "/releases/latest")
      .toPromise()
      .then(res => {
        let latestRelease = res;
        return latestRelease;
      })
      .catch(this.handlePromiseError);
  }

  getAppSecret(): string {
    if(this.isAndroid()){
      return this.config.appCenterSecretAndroid;
    } else {
      return this.config.appCenterSecretiOS;
    }
  }

  getDistributionGroup(): string {
    if(this.isAndroid()){
      return this.config.appCenterDistributionGroupAndroid;
    } else {
      return this.config.appCenterDistributionGroupiOS;
    }
  }

  getPackageVersion(): Promise<any> {
    if (this.isApp()) {
      return this.appVersion.getVersionNumber();
    }
    return new Promise(resolve => {
      resolve('');
    });
  }

  getPackageVersionCode(): Promise<any> {
    if (this.isApp()) {
      return this.appVersion.getVersionCode();    
    }
    return new Promise(resolve => {
      resolve('');
    });
  }

  getPackageName(): Promise<any> {
    if (this.isApp()) {
      return this.appVersion.getPackageName();    
    }
    return new Promise(resolve => {
      resolve('');
    });
  }

  //Server requests
  getDefaultRequestOptions(): any {
    //let reqOptions = new RequestOptions();
    //reqOptions.withCredentials = true;

    //reqOptions.search = new URLSearchParams();
    //reqOptions.search.set("projectId", "VLX");
    //reqOptions.search.set("moduleId", "4");

    //return reqOptions;

    let search = `projectId=${this.projectId}`;
    if (this.moduleId) {
      search += `&moduleId=${this.moduleId}`;
    }
    const token = localStorage.getItem("token");
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
    return {
      withCredentials: true,
      search: search,
      headers: headers
    };
  }

  getDefaultApiRequestOptions(): any {
    let myParams = new URLSearchParams();
    myParams.append("projectId", this.projectId);
    myParams.append("moduleId", this.moduleId.toString());

    let reqOptions = new RequestOptions({ withCredentials: true, params: myParams});
    reqOptions.withCredentials = true;

    return reqOptions;

    //let params = `projectId=${this.projectId}`;
    //if (this.moduleId) {
    //  params += `&moduleId=${this.moduleId}`;
    //}
    //return {
    //  withCredentials: true,
    //  params: params
    //};
  }

  //Notifications
  showAlert(title: string, subject: string) {
    let alert = this.alertCtrl.create({
      title: title,
      message: subject,
      buttons: ['OK']
    });
    alert.present();
  }

  showToast(message: string, toastType: string = "info") {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 5000,
      cssClass: `toast-${toastType}`,
      showCloseButton: true
    });
    toast.present();
  }

  showSuccessToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 5000,
      showCloseButton: true,
      cssClass: "toast-success"
    });
    toast.present();
  }

  showErrorToast(message: string) {
    if (!this.timeoutDialogShown){
     let toast = this.toastCtrl.create({
        message: message,
        duration: 5000,
        showCloseButton: true,
        cssClass: "toast-error"
      });
      toast.present();
    }
  }

  presentLoading(message?: string, onDidDismiss?) {
    this.loading = this.loadingCtrl.create({
      content: message ? message : "Please wait..."
    });

    this.loading.onDidDismiss(() => {
      if (onDidDismiss) {
        onDidDismiss();
      }
    });

    this.loading.present();
  }

  dismissLoading() {
    this.loading.dismiss();
  }

  isApp() : boolean {
    if (this.platform.is('core') || this.platform.is('mobileweb')) {
      return false;
    } else {
      return true;
    }
  }

  isAndroid() : boolean {
    if(this.platform.is('android')){
      return true;
    }
    return false;
  }

  isiOS() : boolean {
    if(this.platform.is('ios')){
      return true;
    }
    return false;
  }

  checkModulePermission(moduleId: number): boolean {
    let moduleFound = this.modulesPermission.find(function(module){
      return module.moduleId == moduleId;
    });
    if(moduleFound){
      return moduleFound.access;
    } else{
      return false;
    }
  }

  hasSubModulePermission(subModuleId: number): boolean{
    return this.subModules.find(subModule => subModule.SubModuleSID == subModuleId)!=null;
   }

  get navCtrl(): NavController {
    //return this.app.getRootNav(); //this function is going to be deprecated
    return this.app.getRootNavs()[0];
  }

  trackEvent(name: string, properties: StringMap): Promise<void> {
    if(this.isApp()){
      return this.appCenterAnalytics.trackEvent(name, properties);
    }
    return new Promise((resolve) => {
      resolve();
    });;
  }

  handlePromiseError(error: any): Promise<any> {
    console.error('An error has occured', error);
    return Promise.reject(error.message || error);
  }
}

export class UpdateModel {

  constructor(public oldVersion?: string, public oldVersionCode?: string, public newVersion?: string, public newVersionCode?: string) {
    this.OldVersion = oldVersion;
    if(oldVersionCode != null && oldVersionCode != '') {
      this.OldVersion = `${this.OldVersion} (${this.oldVersionCode})`;
    }
    this.NewVersion = newVersion;
    if(newVersionCode != null && newVersionCode != '') {
      this.NewVersion = `${this.NewVersion} (${this.newVersionCode})`;
    }
  }
  
  Update: boolean = false;;
  NewVersion: string = '';
  OldVersion: string = '';
  InstallUrl: string = '';
}

