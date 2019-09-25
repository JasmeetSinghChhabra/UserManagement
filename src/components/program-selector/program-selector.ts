import { Component } from '@angular/core';
import { ViewController, LoadingController, Events, NavParams  } from 'ionic-angular';
import { AppService } from '../../services/services';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'program-selector',
  templateUrl: 'program-selector.html'
})
export class ProgramSelector extends BaseComponent {

  programs: any[];
  showClose: boolean;

  constructor(params: NavParams, private app: AppService, public viewCtrl: ViewController, loadingCtrl: LoadingController, private events: Events) {
    super(loadingCtrl);
    let showClose = params.get('showClose');
    if (showClose != undefined) {
      this.showClose = params.get('showClose');
    } else {
      this.showClose = true;
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  ngOnInit(): void {
    if (this.app.programs) {
      this.programs = this.app.programs;
      return;
    }

    this.presentLoading("Fetching programs...");
    this.app.getPrograms().then(programs=> {
      console.log(`Programs successfully retrieved! ${programs.length} programs!`);
      this.programs = programs.filter(program => program.id !== null);
      this.app.programs = this.programs;
      this.dismissLoading();
    }, (err) => {
      this.dismissLoading();
      console.error(err);
      this.app.showErrorToast("Oops! An issue occurred getting programs.");
    });
  }

  itemTapped(event, item) {
    //re-load the app with selected program
    console.log(`Program selected: ${item.id}`);
    //this.app.showToast("Sorry, this feature is not enabled at this moment.");
    //TODO: uncomment this line once the other programs are available
    this.events.publish('program:switch', item);
    this.viewCtrl.dismiss();
  }
}