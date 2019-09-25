import { Injectable } from '@angular/core';
import { ENV } from './env';

@Injectable()
export class AppConfig {
  public endpoint: string;
  public apiEndpoint: string;
  public odataEndpoint: string;
  public installEndpoint: string;
  public isProduction: boolean;
  public googleMapApiKey: string;
  public appCenterApi: string;
  public appCenterSecretAndroid: string;  
  public appCenterSecretiOS: string; 
  public appCenterDistributionGroupAndroid: string;  
  public appCenterDistributionGroupiOS: string; 
  
  public identityServerURL: string;
  public redirectURI: string;
  public postLogoutRedirectURI: string;
  public clientId: string;
  public responseType: string;
  public scope: string;
  public filterProtocolClaims: boolean;
  public loadUserInfo: boolean;

  public fcmSenderId:string;

  constructor() {
    this.endpoint = this._readString('ENDPOINT', 'http://localhost');
    this.apiEndpoint = this.endpoint + "/api";
    this.odataEndpoint = this.endpoint + "/odata";
    this.installEndpoint = this.endpoint.replace("https", "http") + "/MobileApp/Download";
    this.isProduction = this._readBoolean('IS_PRODUCTION', false);
    this.appCenterApi = this._readString('APPCENTER_API', 'https://api.appcenter.ms/v0.1');
    this.appCenterSecretAndroid = this._readString('APPCENTER_APP_SECRET_ANDROID', '');
    this.appCenterDistributionGroupAndroid = this._readString('APPCENTER_DISTRIBUTION_GROUP_ANDROID', '');
    this.appCenterSecretiOS = this._readString('APPCENTER_APP_SECRET_IOS', '');
    this.appCenterDistributionGroupiOS = this._readString('APPCENTER_DISTRIBUTION_GROUP_IOS', '');

    this.identityServerURL = this._readString('IDENTITY_SERVER_URL', 'http://localhost:5000');
    this.redirectURI =this._readString('REDIRECT_URI', 'http://localhost:3000');
    this.postLogoutRedirectURI = this._readString('POST_LOGOUT_REDIRECT_URI', 'http://localhost:3000');
    this.clientId = this._readString('OPENID_CLIENTID', 'js');
    this.responseType = this._readString('OPENID_RESPONSE_TYPE', 'code');
    this.scope = this._readString('OPENID_SCOPE', 'openid profile email');
    this.filterProtocolClaims = this._readBoolean('FILTER_PROTOCOL_CLAIMS', true);
    this.loadUserInfo = this._readBoolean('LOAD_USER_INFO', true);
    this.fcmSenderId = this._readString('FCM_SENDER_ID', null);
  }

  private _readString(key: string, defaultValue?: string): string {
    const v = ENV[key];
    return v === undefined ? defaultValue : String(v);
  }

  private _readBoolean(key: string, defaultValue?: boolean): boolean {
    const v = ENV[key];
    return v === undefined ? defaultValue : v as boolean;
  }

}