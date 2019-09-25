import { Component } from '@angular/core';
import { NavParams, ViewController, IonicPage } from 'ionic-angular';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { AppService, DfrService } from '../../services/services';

//@IonicPage()
@Component({
  templateUrl: 'dfr-approve-reject.html',
  selector: 'dfr-approve-reject',
  providers: [DfrService]
})
export class DfrApproveReject {
  action: string;
  reportId: number;
  siteNumber: number;
  comment: string = '';
  recording: boolean = false;
  recordingText: string = 'Start speech to text';

  constructor(public viewCtrl: ViewController, params: NavParams, private dfrService: DfrService,
    private app: AppService, private speechRecognition: SpeechRecognition) {
    this.action = params.get('action');
    this.reportId = params.get('reportId');
    this.siteNumber = params.get('siteNumber');
  }
  
  commentCompletedLength(): number {
    if (this.comment) {
      return this.comment.length;
    } else {
      return 0;
    }
  }

  isOkButtonDisabled(): boolean {
    if (this.action === 'Reject') return false;
    if (this.action === 'Approve' && this.comment.length >= 150) return false;

    return true;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  doAction() {
    if (this.action === 'Approve') {
      this.app.presentLoading("Approving...");
      this.dfrService.approveDfr(this.reportId, this.comment).subscribe(
        () => {
          this.app.showToast("DFR approved successfully!", "success");
          this.app.dismissLoading();
          this.viewCtrl.dismiss();
        },
        error => {
          console.error(error);
          this.app.showErrorToast("Oops! An error occurred approving DFR.");
          this.app.dismissLoading();
        }
      );
    } else {
      this.app.presentLoading("Rejecting...");
      this.dfrService.rejectDfr(this.reportId, this.comment).subscribe(
        () => {
          this.app.showToast("DFR rejected successfully!", "success");
          this.app.dismissLoading();
          this.viewCtrl.dismiss();
        },
        error => {
          console.error(error);
          this.app.showErrorToast("Oops! An error occurred rejecting DFR.");
          this.app.dismissLoading();
        }
      );
    }
  }

  onSpeechMatch(text: string) {
    if (this.comment == '') {
      this.comment = this.comment + text;
    } else {
      this.comment = this.comment + ', ' + text;
    }
  }

  clearText() {
    this.comment = '';
  }
}
