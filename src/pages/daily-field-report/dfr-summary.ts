import { Component } from '@angular/core';
import { IonicPage, NavParams, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DfrService } from '../../services/services';
import { DfrModel, CrewMember } from '../../models/models';
import { DfrApproveReject } from './dfr-approve-reject';
import * as moment from 'moment';

//@IonicPage()
@Component({
  selector: 'dfr-summary',
  templateUrl: 'dfr-summary.html',
  providers: [DfrService]
})
export class DfrSummary extends BasePage {

  model: DfrModel;
  itemExpandHeight: number = 100;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams,
    private dfrService: DfrService, private app: AppService, private alertCtrl: AlertController,
    private modalCtrl: ModalController) {
    super(loadingCtrl);
    this.model = navParams.get('item');

    if (!this.model) {
      //This a new DFR
      this.model = new DfrModel();
      this.model.ReportDate = moment().format('YYYY-MM-DD');
      this.model.ProjectId = this.app.projectId;
      this.model.Status = "New";
    }
  }

  ngOnInit(): void {
    this.getDfrSummary();
  }

  getDfrSummary() {
    this.presentLoading();
    this.dfrService.getDfrSummary(this.model.ReportId).subscribe(
      dfrSummary => {
        //console.log(dfr);
        this.model = dfrSummary;
        for (var i = 0; i < this.model.ReportEmployeesSummary.length; i++) {
          Object.defineProperty(this.model.ReportEmployeesSummary[i], 'Expanded', { value: false, writable: true });
        }
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
      }
    );
  }

  goToDfr(summary): void {
    this.app.navCtrl.push('DfrForm', {
      item: summary
    });
  }

  approveDfr(): void {
    let approveModal = this.modalCtrl.create(DfrApproveReject, { 'action': "Approve", 'reportId': this.model.ReportId, 'siteNumber': this.model.SiteNumber });
    approveModal.present();
  }

  rejectDfr(): void {
    let rejectModal = this.modalCtrl.create(DfrApproveReject, { 'action': "Reject", 'reportId': this.model.ReportId, 'siteNumber': this.model.SiteNumber });
    rejectModal.present();
  }

  showWindow(title: string, message: string, callback: (comment: string) => any): void {
    let prompt = this.alertCtrl.create({
      title: title,
      message: message,
      inputs: [
        {
          name: 'comment',
          placeholder: 'Comment'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Ok',
          handler: data => {
            return callback(data.comment);
          }
        }
      ]
    });
    prompt.present();
  }

  expandSummaryItem(summary): void {
    //This is not enabled at this moment

    //this.model.ReportEmployeesSummary.map((listItem) => {
    //  if (summary == listItem) {
    //    listItem["Expanded"] = !listItem["Expanded"];
    //  }
    //  return listItem;
    //});
  }

  isDifferentReport(summary): boolean {
    if (summary.ReportId != this.model.ReportId) {
      return true;
    }
    return false;
  }

}
