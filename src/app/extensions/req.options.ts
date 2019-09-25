import { Injectable } from '@angular/core';
import { GeoService } from '../../services/services';
import { RequestOptionsArgs, RequestOptions, URLSearchParams, Headers } from '@angular/http';

@Injectable()
export class RequestOptionsService extends RequestOptions {
  constructor(private geo: GeoService) {
    super();
  }
  merge(options?: RequestOptionsArgs): RequestOptions {
    const newOptions = super.merge(options);
    if (options.url) {
      //Headers are working only for api and odata controllers, standard MVC controllers are not working due CORS isssue
      //So, we are adding custom headers only for api and odata requests
      if (options.url.includes("/api/") || options.url.includes("/odata/")) {       
        if (this.geo.position) {
          newOptions.headers.append('latitude', this.geo.position.coords.latitude.toString());
          newOptions.headers.append('longitude', this.geo.position.coords.longitude.toString());
        }        
      }
    }
    return newOptions;
  }
}