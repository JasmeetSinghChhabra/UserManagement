import { Injectable } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
declare var google;

@Injectable()
export class GeoService {

  position: Geoposition;

  constructor(public geolocation: Geolocation) {
  }

  public getGeolocation(): Promise<Geoposition> {
    let options = {
      timeout: 60000,
      enableHighAccuracy: true
    }
    return this.geolocation.getCurrentPosition(options);
  }

  public watchGeolocation(): void {
    this.geolocation.watchPosition()
      .filter((p) => p.coords !== undefined) //Filter Out Errors
      .subscribe(position => {
        this.position = position;
        console.log(`Latitude: ${position.coords.latitude} - Longitude: ${position.coords.longitude}`);
      });
  }

  public getMap(latitude, longitude, mapEl): any {
    let latLng = new google.maps.LatLng(latitude, longitude);

    let mapOptions = {
      center: latLng,
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    let map = new google.maps.Map(mapEl, mapOptions);
    return map;
  }
  
  public getMarker(latitude, longitude, map): any {
    var latlng = { lat: latitude, lng: longitude };
    let marker = new google.maps.Marker({
      map: map,
      animation: google.maps.Animation.DROP,
      position: latlng
    });
    return marker;
  }

  public geocodeLatLng(latitude, longitude, callback) {
    var latlng = { lat: latitude, lng: longitude };
    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({ 'location': latlng }, (results, status) => {
      if (callback) {
        callback(results, status);
      }
    });
  }

  public getDirections(latitude, longitude): void {
    window.location.href="https://www.google.com/maps/dir/?api=1&destination=" + latitude + "," + longitude;
  }
}
