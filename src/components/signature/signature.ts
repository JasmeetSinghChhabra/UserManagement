import { Component, ViewChild } from '@angular/core';
import { ViewController, NavParams, IonicPage } from 'ionic-angular';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@IonicPage()
@Component({
  selector: 'signature',
  templateUrl: 'signature.html'
})
export class Signature {
  canvasDisabled: boolean;
  imgUrl: string = "";
  imgSrc: string="";
  titleSignature: string = 'Signature';

  constructor(public viewCtrl: ViewController, params: NavParams,  private http: HttpClient, private sanitizer: DomSanitizer) {
    this.canvasDisabled = params.get('canvasDisabled');
    if (this.canvasDisabled) {
      this.imgUrl = params.get('imgUrl');
    }
    let title = params.get('signatureTitle');
    if (title) {
      this.titleSignature = title;
    }
  }

  ngOnInit(): void {
    this.getSignatureImage();       
  }

  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  private signaturePadOptions: Object = { 
    'minWidth': 2,
    'canvasWidth': 310,
    'canvasHeight': 300
  };

  closeModal() {
    this.viewCtrl.dismiss();
  }

  saveSignature() {
    let data = this.signaturePad.toDataURL();
    this.viewCtrl.dismiss(data);    
  }
  
  ngAfterViewInit() {
    this.signaturePad.set('minWidth', 2);
    this.signaturePad.clear();
  }

  drawComplete() {
    //console.log(this.signaturePad.toDataURL());
    //console.log('Drawing complete');
  }

  drawStart() {
    //console.log('Drawing start');
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  getSignatureImage(){
    this.downloadImage(this.imgUrl).subscribe(src=>{
      this.imgSrc = src;
    });
  }
    
  downloadImage(url): Observable<any>{
    return this.http.get(
      url,
    { 
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem("token"), 
    },
    responseType: 'blob'
    }
    )
    .map(blob => {
    var urlCreator = window.URL;
    return this.sanitizer.bypassSecurityTrustUrl(urlCreator.createObjectURL(blob));
    })
  }

}