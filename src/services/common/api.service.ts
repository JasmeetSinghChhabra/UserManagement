import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { Observable } from 'rxjs';

/**
 * Api is a generic REST Api handler.
 */
@Injectable()
export class Api {
  url: string = '';

  constructor(public http: HttpClient, private app: AppService) {
    this.url = app.config.apiEndpoint;
  }

  get(endpoint: string, params?: any, reqOpts?: any):Observable<any> {
    if (!reqOpts) {
      reqOpts = {
        params: new HttpParams()
      };
    }

    // Support easy query params for GET requests
    if (params) {
      reqOpts.params = new HttpParams();
      for (let k in params) {
        reqOpts.params = reqOpts.params.set(k, params[k]);
      }
    }

    this.setReqHeader(reqOpts);
    return this.http.get(this.url + '/' + endpoint, reqOpts);
  }

  post(endpoint: string, body: any, reqOpts?: any) {
    this.setReqHeader(reqOpts);
    return this.http.post(this.url + '/' + endpoint, body, reqOpts);
  }

  put(endpoint: string, body: any, reqOpts?: any) {
    this.setReqHeader(reqOpts);
    return this.http.put(this.url + '/' + endpoint, body, reqOpts);
  }

  delete(endpoint: string, reqOpts?: any) {
    this.setReqHeader(reqOpts);
    return this.http.delete(this.url + '/' + endpoint, reqOpts);
  }

  patch(endpoint: string, body: any, reqOpts?: any) {
    this.setReqHeader(reqOpts);
    return this.http.put(this.url + '/' + endpoint, body, reqOpts);
  }

  public setReqHeader(reqOpts?: any) {
    //Add token header
    reqOpts.headers= new HttpHeaders({ 
      'Authorization': 'Bearer ' + localStorage.getItem("token")
    })
  }
}
