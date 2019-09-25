import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';


@Injectable()
export class FeaturesAccessService {

  constructor(private http: Http) {
  }

  getFeaturesConfigFile(): Promise<any> {
    return this.http.get('assets/data/programfeatures.json')
      .map((response: Response) => response.json()).toPromise();
  }
}
