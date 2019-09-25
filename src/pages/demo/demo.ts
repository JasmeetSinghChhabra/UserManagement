import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { AudioProvider, IAudioTrack, ITrackConstraint } from 'ionic-audio';
import { IonicPage, LoadingController, NavController, ToastController, Events, Platform, AlertController } from 'ionic-angular';
import { AuthService, AppService } from '../../services/services';
import { AudioNoteComponent } from '../../components/audio-note/audio-note';

//@IonicPage()
@Component({
  selector: 'demo',
  templateUrl: 'demo.html'
})
export class Demo {
  testCheckboxOpen: boolean;
  testRadioOpen: boolean;
  testCheckboxResult: any;
  testRadioResult: any;
  myTracks: ITrackConstraint[];
  allTracks: any[];
  selectedTrack: any;
  playlist: ITrackConstraint[] = [];
  currentIndex: number = -1;
  currentTrack: ITrackConstraint;
  @ViewChild('audiocontrolfull') audiocontrolfull: AudioNoteComponent;
  @ViewChild('audiocontrolsmall') audiocontrolsmall: AudioNoteComponent;

  constructor(private _audioProvider: AudioProvider, private _cdRef: ChangeDetectorRef, private navCtrl: NavController,
              private toastCtrl: ToastController, public auth: AuthService, private events: Events, private app: AppService,
              public alerCtrl: AlertController, platform: Platform) {
    this.myTracks = [{
      src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t12-MP3-V0.mp3',
      artist: 'John Mayer',
      title: 'Why Georgia',
      art: 'assets/images/demo/johnmayer.jpg',
      preload: 'metadata' // tell the plugin to preload metadata such as duration for this track, set to 'none' to turn off
    },
    {
      src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t30-MP3-V0.mp3',
      artist: 'John Mayer',
      title: 'Who Says',
      art: 'assets/images/demo/johnmayer.jpg',
      preload: 'metadata' // tell the plugin to preload metadata such as duration for this track,  set to 'none' to turn off
    },
    {
      src: 'https://archive.org/download/swrembel2010-03-07.tlm170.flac16/swrembel2010-03-07s1t05.mp3',
      artist: 'Stephane Wrembel',
      title: 'Stephane Wrembel Live',
      art: 'assets/images/demo/Stephane.jpg',
      preload: 'metadata' // tell the plugin to preload metadata such as duration for this track,  set to 'none' to turn off
    }];
  }

  ngOnInit() {
    this.audiocontrolfull.addTestAudioFile('http://archive.org/download/testmp3testfile/mpthreetest.mp3', "Cosme Fulanito", false);
    this.audiocontrolfull.addTestAudioFile('http://archive.org/download/testmp3testfile/mpthreetest.mp3', "Cosme Fulanito", true);
    this.audiocontrolsmall.addTestAudioFile('http://archive.org/download/testmp3testfile/mpthreetest.mp3', "Cosme Fulanito", false);
    this.audiocontrolsmall.addTestAudioFile('http://archive.org/download/testmp3testfile/mpthreetest.mp3', "Cosme Fulanito", true);
  }
  
  ngAfterContentInit() {
    // get all tracks managed by AudioProvider so we can control playback via the API
    this.allTracks = this._audioProvider.tracks;
  }

  playSelectedTrack() {
    // use AudioProvider to control selected track 
    this._audioProvider.play(this.selectedTrack);
  }

  pauseSelectedTrack() {
    // use AudioProvider to control selected track 
    this._audioProvider.pause(this.selectedTrack);
  }

  add(track: ITrackConstraint) {
    this.playlist.push(track);
  }

  play(track: ITrackConstraint, index: number) {
    this.currentTrack = track;
    this.currentIndex = index;
  }

  next() {
    // if there is a next track on the list play it
    if (this.playlist.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.playlist.length - 1) {
      let i = this.currentIndex + 1;
      let track = this.playlist[i];
      this.play(track, i);
      this._cdRef.detectChanges();  // needed to ensure UI update
    } else if (this.currentIndex == -1 && this.playlist.length > 0) {
      // if no track is playing then start with the first track on the list
      this.play(this.playlist[0], 0);
    }
  }

  onTrackFinished(track: any) {
    this.next();
  }

  clear() {
    this.playlist = [];
  }

  //// Start for demos //////////////////////////////////

  doAlert() {
    let alert = this.alerCtrl.create({
      title: 'New Friend!',
      message: 'Your friend, Obi wan Kenobi, just approved your friend request!',
      buttons: ['Ok']
    });
    alert.present();
  }

  doPrompt() {
    let prompt = this.alerCtrl.create({
      title: 'Login',
      message: "Enter a name for this new album you're so keen on adding",
      inputs: [
        {
          name: 'title',
          placeholder: 'Title'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            console.log('Saved clicked');
          }
        }
      ]
    });
    prompt.present();
  }

  doConfirm() {
    let confirm = this.alerCtrl.create({
      title: 'Use this lightsaber?',
      message: 'Do you agree to use this lightsaber to do good across the intergalactic galaxy?',
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  showRadio() {
    let alert = this.alerCtrl.create();
    alert.setTitle('Lightsaber color');

    alert.addInput({
      type: 'radio',
      label: 'Blue',
      value: 'blue',
      checked: true
    });
    alert.addInput({
      type: 'radio',
      label: 'Red',
      value: 'red',
      checked: false
    });
    alert.addInput({
      type: 'radio',
      label: 'Yellow',
      value: 'yellow',
      checked: false
    });
    alert.addInput({
      type: 'radio',
      label: 'Black',
      value: 'black',
      checked: false
    });


    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        this.testRadioOpen = false;
        this.testRadioResult = data;
      }
    });
    alert.present();
  }

  doCheckbox() {
    let alert = this.alerCtrl.create();
    alert.setTitle('Which planets have you visited?');

    alert.addInput({
      type: 'checkbox',
      label: 'Alderaan',
      value: 'value1',
      checked: true
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Bespin',
      value: 'value2'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Coruscant',
      value: 'value3'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Endor',
      value: 'value4'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Hoth',
      value: 'value5'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Jakku',
      value: 'value6'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Naboo',
      value: 'value6'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Takodana',
      value: 'value6'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'Tatooine',
      value: 'value6'
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Okay',
      handler: data => {
        console.log('Checkbox data:', data);
        this.testCheckboxOpen = false;
        this.testCheckboxResult = data;
      }
    });
    alert.present().then(() => {
      this.testCheckboxOpen = true;
    });
  }

  public event = { // DATE TIME
    month: '1990-02-19',
    timeStarts: '07:43',
    timeEnds: '1990-02-20'
  };

  /* TOAST */

  showToast(position: string) { /* Show Toast */
    let toast = this.toastCtrl.create({
      message: 'Mmmm, buttered toast',
      duration: 2000,
      cssClass: 'info',
      position: position
    });

    toast.present(toast);
  }

  showToastInfo(position: string) { /* ssClass info */
    let toast = this.toastCtrl.create({
      message: 'Mmmm, buttered toast',
      duration: 3000,
      cssClass: 'toast-info',
      position: position
    });

    toast.present(toast);
  }

  showToastWarning(position: string) { /* ssClass warning */
    let toast = this.toastCtrl.create({
      message: 'Mmmm, buttered toast',
      duration: 3000,
      cssClass: 'toast-warning',
      position: position
    });

    toast.present(toast);
  }

  showToastSuccess(position: string) { /* ssClass success */
    let toast = this.toastCtrl.create({
      message: 'Mmmm, buttered toast',
      duration: 3000,
      cssClass: 'toast-success',
      position: position
    });

    toast.present(toast);
  }

  showToastError(position: string) { /* ssClass error */
    let toast = this.toastCtrl.create({
      message: 'Mmmm, buttered toast',
      duration: 3000,
      cssClass: 'toast-error',
      position: position
    });

    toast.present(toast);
  }

  showToastWithCloseButton() {
    const toast = this.toastCtrl.create({
      message: 'Your files were successfully saved',
      showCloseButton: true,
      closeButtonText: 'Ok'
    });
    toast.present();
  }

  showLongToast() {
    let toast = this.toastCtrl.create({
      message: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ea voluptatibus quibusdam eum nihil optio, ullam accusamus magni, nobis suscipit reprehenderit, sequi quam amet impedit. Accusamus dolorem voluptates laborum dolor obcaecati.',
      duration: 2000,
    });
    toast.present();
  }

}
