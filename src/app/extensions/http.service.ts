import { Injectable } from '@angular/core';
import { Request, XHRBackend, RequestOptions, Response, Http, RequestOptionsArgs, Headers } from '@angular/http';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';


@Injectable()
export class AccuVHttp extends Http {

  constructor(backend: XHRBackend, defaultOptions: RequestOptions, private events: Events) {
    super(backend, defaultOptions);
  }

  request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    return super.request(url, options)
      .catch(this.handleError);    
  }

  public handleError = (error: Response) => {
      // Security errors
      if (error.status === 401) {
        this.events.publish('token:expired');
      }
      //Add any other error here

      return Observable.throw(error);   
  }

}