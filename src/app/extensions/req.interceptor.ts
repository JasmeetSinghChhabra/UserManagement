import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';

import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
 
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
 
@Injectable()
export class RequestInterceptor implements HttpInterceptor {
 
  constructor(private events: Events) {}
 
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).do((event: HttpEvent<any>) => {}, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          this.events.publish('token:expired');
        }
      }
    });
  }
}