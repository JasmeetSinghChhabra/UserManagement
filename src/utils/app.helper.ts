import { Injectable } from "@angular/core";

@Injectable()
export class Helper {

  getFormUrlEncoded(form): string {
    const formBody = [];
    for (const property in form) {
      if (form.hasOwnProperty(property)) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(form[property]);
        formBody.push(encodedKey + '=' + encodedValue);
      }
    }
    return formBody.join('&');
  }

  getParameterByName(name, url): string {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  parseOdataError(error): string {
    let odataError = null;
    try {
      let odataError = JSON.parse(error)['odata.error'];
      if (!odataError) odataError = JSON.parse(error._body)['odata.error'];
      if (odataError) {
        return odataError.message.value;
      } else {
        return null;
      }
    } catch (e) {
      if (!odataError) odataError = JSON.parse(error._body)['odata.error'];
      if (odataError) {
        return odataError.message.value;
      } else {
        return null;
      }
    }
  }

  camelToDash(s: string): string {
    return s.replace(/([A-Z])/g, function ($1, p1, pos) { return (pos > 0 ? "-" : "") + $1.toLowerCase(); });
  }

  camelToRegular(s: string): string {
    return s.replace(/([A-Z])/g, function ($1, p1, pos) { return (pos > 0 ? " " : "") + $1; });
  }

  isNullOrUndefinedOrEmpty(val){
    return val == null || val == undefined || val == '';
  }

  ifModalClose(m){
    if(m!= undefined && m != null &&  typeof(m.dismiss) == 'function') m.dismiss();
  }

  transformVoipJsonData(data, isJsObj){
    console.log('is this object ? '+ isJsObj);
    var dataFormatted =  {additionalData:{auxParameters:null}, title:null, body:null };
    
    try{
    if(isJsObj == true) dataFormatted = {additionalData:data, title:data.aps.alert.title, body:data.aps.alert.body };
    else{
      
      var jsonData = JSON.parse(data);
      dataFormatted = {additionalData:jsonData, title:jsonData.aps.alert.title, body:jsonData.aps.alert.body };
    }
    if(dataFormatted.additionalData.auxParameters != null) dataFormatted.additionalData.auxParameters = JSON.parse(dataFormatted.additionalData.auxParameters);
  }catch(err){console.log('error trying to transform voip data into json'); console.log(err);}
    return dataFormatted;
  }

  isJsonObject(obj){
    
    if(obj == null || obj == undefined) return false;
    if(typeof(obj.hasOwnProperty) == 'function') return true;
    return false;
  }

  generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

}
