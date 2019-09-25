import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { Helper } from '../../utils/app.helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import { AppService } from './app.service';

@Injectable()
export class SignatureService {

  constructor(private http: Http, private helper: Helper, private app: AppService) {
  }

  //Future implementation
  //saveSignature(url: string, body): Promise<any> {
  //  let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
  //  let options = new RequestOptions({
  //    headers: headers,
  //    withCredentials: true
  //  });

  //  return this.http.put(url, this.helper.getFormUrlEncoded(body), options)
  //    .toPromise();
  //}

  saveSignature(url: string, body, errorHandler, successHandler) {
    var formData = new FormData();
    for (var key in body) {
      if (body.hasOwnProperty(key)) {
        formData.append(key, body[key]);
      }
    }
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("token"));
    xhr.withCredentials = true;
    xhr.send(formData);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status <= 204) {
          successHandler();;
        } else {
          errorHandler(xhr.responseText);
        }
      }
    };
    xhr.onerror = () => {
    };
  }
}