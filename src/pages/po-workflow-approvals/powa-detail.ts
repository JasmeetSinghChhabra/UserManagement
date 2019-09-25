import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar, AlertController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, PowaService, AuthService } from '../../services/services';
import { PowaModel, PowaType, PowaLine } from '../../models/models';

@Component({
  selector: 'powa-detail',
  templateUrl: 'powa-detail.html',
  providers: [PowaService]
})
export class PowaDetail extends BasePage {
  @ViewChild(Searchbar) searchbar: Searchbar;
  @ViewChild('header') header: ElementRef;
  powa: PowaModel;
  powaLines : PowaLine[];
  updateListOnBack: any;
  showTopBar: boolean;
  showGroup = true;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private powaService: PowaService, 
    private app: AppService, private auth: AuthService, private alertCtrl: AlertController) {
    super(loadingCtrl);
    this.powa = navParams.get("item");
    this.powaLines = [];
    this.showTopBar = false;
  }

  ngOnInit(): void {

    this.app.presentLoading();
    this.powaService.getPOLines(this.powa.type, this.powa.PONumber, this.powa.projectId).then(
      data => {
        if (data.Data){
          data.Data.forEach(powaLine => {
            this.powaLines.push(powaLine as PowaLine)
          });
          //console.log(this.powaLines);
        }
        this.app.dismissLoading();
      },
      error => {
        console.error(error);
      }
    );
    
    this.updateListOnBack = this.navParams.get("updateListOnBack");
  }

  processAproval(approve){
    let alert = this.alertCtrl.create({
      title: this.getTitle(),
      inputs: [
        {
          name: 'reason',
          placeholder: 'Comment'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'powa-cancel-button',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: approve? "Approve": "Reject",
          cssClass: approve? "powa-approve-button" : "powa-reject-button",
          handler: data => {
            if (!approve && data.reason == ''){
              let errorAlert = this.alertCtrl.create({
                title: 'Error',
                message: 'Please enter a comment before rejecting an item.',
                buttons: ['Ok']
              });
              errorAlert.present();
            } else {
              this.app.presentLoading();
              let powas = [];
              powas.push(this.powa);
              this.powaService.processApprovals(approve, powas, data.reason)
              .then(data=>{
                //console.log(data);
                this.app.dismissLoading();
                this.updateListOnBack(this.powa, approve);
                this.app.navCtrl.pop();
              }, error=>{
                this.app.dismissLoading();
                //console.log(error);
              });
            }
          }
        }
      ]
    });
    alert.present();
  }
  getShowTopBarClasses() {
    return {
        'show': this.showTopBar
    };
  }
  onContentScroll = function(e) {
    this.showTopBar = e.scrollTop > 100;
    this.header.nativeElement.className="powa-po-total-top" + (this.showTopBar? " show" : "");
  }

  getColor(powaLine){
    if (powaLine.status == "Pending Approval"){
      return "primary";
    } else if (powaLine.status == "Issued"){
      return "secondary";
    } else {
      return "#dedede";
    }
  }

  getTitle(): string{
    if (this.powa.type == "PO"){
      return this.powa.PONumber;
    } else {
      return "Closeout Cost";
    }
  }

  getStatusClass(powaLine): string {
    if (powaLine.POLineStatus == "Pending Approval"){
      return "status-pending-approval";
    } else {
      return "status-issued";
    }
  }

  toggleGroup() {
    this.showGroup = !this.showGroup;
  };

  isGroupShown() {
    return this.showGroup;
  };
}