import { Injectable } from '@angular/core';
import { Helper } from '../../utils/app.helper';
import { AppService, Settings, Api} from '../services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable'; 
import Oidc, { UserManager, UserManagerSettings, User } from 'oidc-client';
import 'rxjs/add/operator/toPromise';
import { AppConfig } from '../../app/config/app.config';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Events } from 'ionic-angular';

@Injectable()
export class AuthService {
  
  private manager = new UserManager(this._getClientSettings());
  user: User = null;
  userInfo : AdditonalUserInformation = null;

  constructor(private http: HttpClient, private helper: Helper, private app: AppService, private settings: Settings, private api: Api, 
    private events: Events) {
    this.manager.getUser().then(user => {
      if(user){
        this.user = user;
        this.app.presentLoading('fetching user information...');
        this.setAdditionalUserInfoFromDB().then(res=>{
          this.userInfo = res;
          this.events.publish('user:infoSet', res);
        }).catch(()=>{
          this.app.dismissLoading();
          this.app.showErrorToast('Oops! An issue occurred loading user information.');
        });
      }
    });
  }

  isLoggedIn(): boolean {
    // if (window.localStorage.getItem('token')) {
    //   return true;
    // }
    // else {
    //   return false;
    // }
    // Check if the user information is set and if the token is not expired
    return this.user != null && !this.user.expired;
  }
  
  startAuthentication() {
    //Uses cordova in app browser (comment out when doing local dev)
    this.manager.signinPopup().then((user) => {
      this.setUserInfo(user);
    }).catch((e) => { 
      console.log(e); 
    });

    //Only used for local development
    //return this.manager.signinRedirect();
  }
  
  logout() {  
    return this.manager.signoutPopup().then((resp) => {
     localStorage.removeItem('token');
      this.app.clearAppData()
     console.log('signed out', resp);
    }).catch(function (err) {
      console.log(err);
    });
    //Only used for local development
     // localStorage.removeItem('token');
     // this.manager.signoutRedirect()
  }

    //Only used for local development
    verifyLoginCallback(): Promise<boolean>{
      return this.manager.signinRedirectCallback().then(user => {
        this.setUserInfo(user);
        return true;
      }).catch((e)=>{
        console.log(e);
        return false
      });
    }
  
    private setUserInfo(user: Oidc.User){
      this.user = user;
      localStorage.setItem ('token', user.access_token);
      this.app.presentLoading('fetching user information...');
      this.setAdditionalUserInfoFromDB().then(res=>{
        this.userInfo = res;
        this.events.publish('user:infoSet', res);
      }).catch(()=>{
        this.app.dismissLoading();
        this.app.showErrorToast('Oops! An issue occurred loading user information.');
      });

      this.events.publish('user:login');
    }

  getUserSubModules(): Promise<any> {
    let headers = new HttpHeaders({ 
      'Authorization': 'Bearer ' + localStorage.getItem("token"), 
      'Content-Type':  'application/json', 
    });
    return this.http.get(this.app.config.apiEndpoint + `/UserActivities/GetUserSubModulesAllModules?projectId=${this.app.projectId}&userSID=${this.userInfo.UserSId}`,  
    {
      headers: headers,
      withCredentials: true
    }).toPromise();
  }
  
  setAdditionalUserInfoFromDB(): Promise<any>{
    return this.api.get("/Authentication/GetAdditionalUserInformation").toPromise()
  }
  
  setAdditionalUserInfoFromDBUsingProjectId(projectdId: string): Promise<any> {
    let options = this.app.getDefaultRequestOptions();
    
    if(!this.app.projectId){
      throw "Oops! projectId is required";
    }
    return this.api.get("/Authentication/GetAdditionalUserInformation", options)
    .toPromise()
    .then(res => {
      this.userInfo.UserTypeId = res.UserTypeId;
      this.userInfo.UserSId = res.UserSId;//SId for project
      this.userInfo.UserTypeDescription = res.UserTypeDescription;
      this.userInfo.IsUserGC = res.IsUserGC;
      this.userInfo.IsUserAdmin = res.IsUserAdmin;
        this.userInfo.Company = res.Company;
        this.userInfo.UserEmail = res.UserEmail;
      return this.userInfo;
    })
    .catch(this.app.handlePromiseError);
  }
  
  private _getClientSettings(): UserManagerSettings {
    return {
      authority: this.app.config.identityServerURL,
      client_id: this.app.config.clientId,
      redirect_uri: this.app.config.redirectURI,
      post_logout_redirect_uri: this.app.config.postLogoutRedirectURI,
      response_type: this.app.config.responseType,
      scope: this.app.config.scope,
      filterProtocolClaims: this.app.config.filterProtocolClaims,
      loadUserInfo: this.app.config.loadUserInfo,
      popupNavigator: new Oidc.CordovaPopupNavigator(),
      iframeNavigator: new Oidc.CordovaIFrameNavigator(),
    };
  }

} 
export interface AdditonalUserInformation {
  UserSId: number;
  UserId: string;
  UserName: string;
  UserTypeId: number;
  UserTypeDescription: string;
  IsUserGC: boolean;
  IsUserAdmin: boolean;
  DefaultView: string;
  Company: string;
  UserEmail: string;
  LocalAuth: boolean;
}
