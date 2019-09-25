import { Component, ViewChild, ElementRef, Renderer, EventEmitter, Input, Output, OnDestroy, OnChanges, Optional, SimpleChanges } from '@angular/core';
import { Http } from '@angular/http';
import { Platform, LoadingController, Form, Item } from 'ionic-angular';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { FileTransfer, FileUploadOptions, FileTransferObject, FileUploadResult } from '@ionic-native/file-transfer';
import { AppService, AuthService } from '../../services/services';
import { AudioProvider, IAudioTrack, ITrackConstraint } from 'ionic-audio';
import { SimpleTimer } from 'ng2-simple-timer';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'audio-note',
  templateUrl: 'audio-note.html'
})
export class AudioNoteComponent extends BaseComponent implements ControlValueAccessor, OnDestroy, OnChanges {

  @Output() onAudioUploading = new EventEmitter<string>();
  @Output() onAudioUploaded = new EventEmitter<string>();
  @Output() onAudioRemoved = new EventEmitter<string>();
  @Input() mode = 'single';
  @Input() title = 'Audio Note';
  @Input() filePrefix = 'audio';
  @Input() trackType = 'full';
  recording: boolean;
  recordingPaused: boolean;
  filePath: string;
  fileName: string;
  fileFullName: string;
  audio: MediaObject;

  private myTracks: AudioNote[] = [];
  get tracks(): any[] {
    return this.myTracks;
  }
  @Input('tracks')
  set tracks(tracks: any[]) {
    for (let i = 0; i < tracks.length; i++) {
      this.addAudioFile(tracks[i].fileName, tracks[i].user);
    }
  }
  counter = 0;
  timerId: string;
  timer = '00:00';

  constructor(private renderer: Renderer, private app: AppService, private auth: AuthService, private media: Media,
    private file: File, private platform: Platform, protected loadingCtrl: LoadingController, private http: Http,
    private audioProvider: AudioProvider, private st: SimpleTimer, private fileTransfer: FileTransfer,
    private ionForm: Form, @Optional() private ionItem: Item) {
    super(loadingCtrl);
  }

  //OnDestroy
  ngOnDestroy() {
    this.ionForm.deregister(this);
  }

  //OnChanges
  ngOnChanges(changes: SimpleChanges) {
    console.log("Audio note control: ngOnChanges");
  }

  initFocus() { }

  //ControlValueAccessor
  private propagateChange = (_: any) => { }

  writeValue(value: any) {
    this.setValue(value);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) { }

  setDisabledState(isDisabled: boolean) {
    this.renderer.setElementClass(this.ionItem.getNativeElement(), 'item-audio-disabled', isDisabled);
  }

  setValue(value: any) {
    console.log("Audio note control: setValue");
    this.addAudioFile(value.fileName, value.user);
  }

  ngOnInit(): void {
    this.st.newTimer('1sec', 1);
    this.recording = false;
    this.recordingPaused = false;
    this.ionForm.register(this);

    //let audioFile_1 = {
    //  isUploaded: true,
    //  src: 'http://archive.org/download/testmp3testfile/mpthreetest.mp3',
    //  fileName: 'Test Audio',
    //  title: 'Audio Note',
    //  artist: this.auth.userInfo ? this.auth.userInfo.UserName : "",
    //  art: 'assets/images/components/audio-track.jpg',
    //  preload: 'metadata'
    //};
    //this.myTracks.push(audioFile_1);
    //let audioFile_2 = {
    //  isUploaded: false,
    //  src: 'http://archive.org/download/testmp3testfile/mpthreetest.mp3',
    //  fileName: 'Test Audio',
    //  title: 'Audio Note',
    //  artist: this.auth.userInfo ? this.auth.userInfo.UserName : "",
    //  art: 'assets/images/components/audio-track.jpg',
    //  preload: 'metadata'
    //};
    //this.myTracks.push(audioFile_2);
  }

  //RECORD start
  private record(): void {
    //Validate if the control is single recording mode
    if (this.mode === "single") {
      if (this.myTracks.length >= 1) {
        this.app.showAlert("Validation", "You've already recorded an audio note. Please, remove it before recording again.");
        return;
      }
    }

    if (this.app.isApp()) {
      if (!this.recording) {
        this.startRecord();
      } else {
        this.stopRecord();
      }
    } else {
      //Mock recording
      if (!this.recording) {
        console.log("Start recording...");
        this.recording = true;
        this.timerId = this.st.subscribe('1sec',
          () => {
            this.counter++;
            this.timer = this.getSecondsAsDigitalClock(this.counter);
          });
      } else {
        console.log("Stop recording...");
        this.st.unsubscribe(this.timerId);
        this.counter = 0;
        this.recording = false;
      }
    }
  }

  private recordingColor(): string {
    if (this.recording) {
      return "danger";
    } else {
      return "light";
    }
  }

  private startRecord() {
    console.log("Start recording...");
    this.recording = true;
    this.timerId = this.st.subscribe('1sec',
      () => {
        this.counter++;
        this.timer = this.getSecondsAsDigitalClock(this.counter);
      });
    //Create the audio file
    this.fileName = this.createFileName(this.filePrefix);
    this.filePath = this.getFilePath();
    this.fileFullName = this.getFilePath() + this.fileName;

    this.audio = this.media.create(this.fileFullName);
    this.audio.onStatusUpdate.subscribe(status => {
      console.log(status);
    });
    this.audio.onSuccess.subscribe(() => {
      console.log('Recording finish successfully');
    });
    this.audio.onError.subscribe(error => {
      console.log('Error recording audio!', error);
      this.recording = false;
    });
    this.audio.startRecord();
  }

  private stopRecord() {
    console.log("Stop recording...");
    this.st.unsubscribe(this.timerId);
    this.counter = 0;
    this.recording = false;

    this.audio.stopRecord();  
    let audioFile = {
      isUploaded: false,
      src: this.getFilePath() + this.fileName,
      fileName: this.fileName,
      title: 'Audio Note',
      artist: this.auth.userInfo.UserName,
      art: 'assets/images/components/audio-track.jpg',
      preload: 'metadata'
    };
    this.myTracks.push(audioFile);
    this.audio.release();    
  }

  private getSecondsAsDigitalClock(inputSeconds: number) {
    var sec_num = parseInt(inputSeconds.toString(), 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var hoursString = '';
    var minutesString = '';
    var secondsString = '';
    hoursString = (hours < 10) ? "0" + hours : hours.toString();
    minutesString = (minutes < 10) ? "0" + minutes : minutes.toString();
    secondsString = (seconds < 10) ? "0" + seconds : seconds.toString();
    return minutesString + ':' + secondsString;
  }
  //RECORD end

  //AUDIO FILES start
  public getAudioList(): AudioNote[] {
    return this.myTracks;
  }

  private uploadAudio(audioFile, idx) : void {
    this.presentLoading("Uploading audio...");

    this.upload(audioFile.track).then((data) => {
      // success
      //audioFile.track.isUploaded = true;
      this.dismissLoading();
      this.app.showSuccessToast("Audio note uploaded successfully!");
      console.log("Audio note uploaded successfully");
    }, (err) => {
      // error
      this.dismissLoading();
      this.app.showErrorToast("Oops! Error uploading audio note");
      console.log("Oops! An error has occurred uploading audio file");
    });
  }

  private uploadAudios(audioFiles: AudioNote[]): Promise<FileUploadResult[]> {
    return new Promise((resolve, reject) => {
      let promises: Promise<FileUploadResult>[] = [];
      for (var i = 0; i < audioFiles.length; i++) {
        if (audioFiles[i].isUploaded == false) {
          promises.push(this.upload(audioFiles[i]));
        };
      }
      Promise.all(promises).then(res => {
        console.log(res);
        resolve(res);
      }, error => {
        console.log(error);
        reject();
      });
    });
  }

  public uploadAllPendingAudios(): Promise<FileUploadResult[]> {
    let pendingAudios = this.myTracks.filter(a => a.isUploaded == false);
    return this.uploadAudios(pendingAudios);
  }

  onUploadAllPendingAudios(): void {
    this.presentLoading("Uploading audios...");
    this.uploadAllPendingAudios().then(() => {
      this.dismissLoading();
      this.app.showSuccessToast("Audio notes uploaded successfully!");
    }, error => {
      this.dismissLoading();
      this.app.showErrorToast("Oops! Error uploading audio notes");
    });
  }

  private upload(audioFile): Promise<FileUploadResult> {    
    let fileName = audioFile.fileName;
    let fileFullName = this.getFilePath() + fileName;
    let ft = this.fileTransfer.create();

    let options: FileUploadOptions = {
      fileKey: "UploadedAudioNote",
      fileName: fileName,
      headers: {
		"Authorization": "Bearer " + localStorage.getItem("token"),
        projectId: this.app.projectId,
        moduleId: this.app.moduleId
      }   
    };

    //TODO: seems like the file transfer plugin doesn't work over https
    let url = `${this.getAudioEndPoint()}/mobilereports/uploadaudionote`;
    let promise = ft.upload(fileFullName, encodeURI(url), options);
    promise.then(() => {
      audioFile.isUploaded = true;
      this.onAudioUploaded.emit(audioFile.fileName);
    }, (error) => {
      console.log("Oops! Error uploading audio file: " + fileName + " - Error: " + JSON.stringify(error));
    });
    return promise;
  }

  private upload_xhr(audioFile) {
    //TODO: implement the upload operation using XMLHttpRequest because cordova FileTransfer plugin is deprecated

    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
    //  console.log('file system open: ' + fs.name);
    //  fs.root.getFile('bot.png', { create: true, exclusive: false }, function (fileEntry) {
    //    fileEntry.file(function (file) {
    //      var reader = new FileReader();
    //      reader.onloadend = function () {
    //        // Create a blob based on the FileReader "result", which we asked to be retrieved as an ArrayBuffer
    //        var blob = new Blob([new Uint8Array(this.result)], { type: "image/png" });
    //        var oReq = new XMLHttpRequest();
    //        oReq.open("POST", "http://mysweeturl.com/upload_handler", true);
    //        oReq.onload = function (oEvent) {
    //          // all done!
    //        };
    //        // Pass the blob in to XHR's send method
    //        oReq.send(blob);
    //      };
    //      // Read the file as an ArrayBuffer
    //      reader.readAsArrayBuffer(file);
    //    }, function (err) { console.error('error getting fileentry file!' + err); });
    //  }, function (err) { console.error('error getting file! ' + err); });
    //}, function (err) { console.error('error getting persistent fs! ' + err); });
  }

  private removeAudio(audioFile, idx) {
    let fileName = audioFile.track.fileName;
    if (audioFile.track.isUploaded) {
      //Remove audio file in server side
      let url = `${this.app.config.apiEndpoint}/mobilereports/deleteaudionote?fileName=${fileName}&projectId=${this.app.projectId}&moduleId=${this.app.moduleId}`;
      this.http.delete(url)
        .toPromise()
        .then(res => {
          this.myTracks.splice(idx, 1);
          this.app.showSuccessToast("Audio note removed successfully!");
          console.log(`Audio file ${fileName} removed successfully on server`);
        }, error => {
          this.app.showErrorToast("Oops! Error removing audio file");
          console.log(`Error removing audio file ${fileName}`);
        })
        .catch(this.app.handlePromiseError);
      this.onAudioRemoved.emit(fileName);
    } else {
      //Remove audio file locally, still not uploaded to server audio library
      this.file.removeFile(this.getRemoveFilePath(), fileName).then(success => {
        this.myTracks.splice(idx, 1);
        this.app.showSuccessToast("Audio note removed successfully!");
        console.log(`Audio file ${fileName} removed successfully`);
      }, error => {
        this.app.showErrorToast("Oops! Error removing audio file");
        console.log(`Error removing audio file ${fileName}`);
      });
    }
  }
  
  private getFileFullName(audioFile): string {
    let filePath = '';
    if (this.platform.is('ios')) {
      filePath = this.file.documentsDirectory.replace(/file:\/\//g, '') + audioFile.fileName;
    } else if (this.platform.is('android')) {
      filePath = this.file.externalDataDirectory.replace(/^file:\/\//, '') + audioFile.fileName;
    }
    return filePath;
  }

  private getRemoveFilePath(): string {
    let filePath = '';
    if (this.platform.is('ios')) {
      filePath = this.file.documentsDirectory;
    } else if (this.platform.is('android')) {
      filePath = this.file.externalDataDirectory;
    }
    return filePath;
  }

  private getFilePath(): string {
    let filePath = '';
    if (this.platform.is('ios')) {
      filePath = this.file.documentsDirectory.replace(/file:\/\//g, '');
    } else if (this.platform.is('android')) {
      filePath = this.file.externalDataDirectory;
    }
    return filePath;
  }

  private getAudioEndPoint(){
    let endPoint = this.app.config.apiEndpoint;
    if (!this.platform.is('ios')) {
      endPoint = endPoint.replace("https", "http");
    }
    return endPoint;
  }

  private createFileName(prefix): string {
    let fileName = '';
    if (this.platform.is('ios')) {
      fileName = prefix + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + '.m4a';
    } else if (this.platform.is('android')) {
      fileName = prefix + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + '.m4a';
    }
    return fileName;
  }

  public hasPendingUploads(): boolean {
    for (var i = 0; i < this.myTracks.length; i++) {
      if (this.myTracks[i].isUploaded == false) return true;
    }
    return false;
  }

  public addAudioFile(fileName, user): void {
    //TODO: seems like the media plugin doesn't work over https, another option is download the file, store it in local storage and then reproduce it from there
    let url = `${this.getAudioEndPoint()}/mobilereports/getaudionote?fileName=${fileName}&projectId=${this.app.projectId}&moduleId=${this.app.moduleId}`;
    let audioFile = {
      isUploaded: true,
      src: url,
      fileName: fileName,
      title: 'Audio Note',
      artist: user,
      art: 'assets/images/components/audio-track.jpg',
      preload: 'metadata'
    };
    this.myTracks.push(audioFile);
  }
  //AUDIO FILES end 

  //TEST
  playTest() {
    // Create a Media instance.  Expects path to file or url as argument
    // We can optionally pass a second argument to track the status of the media
    const file: MediaObject = this.media.create('https://10.104.3.94/api/mobilereports/getaudionote?fileName=dfr_work_performed_21201803138.3gp&projectId=VLX&moduleId=4');    

    // to listen to plugin events:
    file.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
    file.onSuccess.subscribe(() => console.log('Action is successful'));
    file.onError.subscribe(error => console.log('Error!', error));

    // play the file
    file.play();
  }

  addTestAudioFile(url, user, isUploaded): void {
    let audioFile = {
      isUploaded: isUploaded,
      src: url,
      fileName: "test.3gp",
      title: 'Audio Note',
      artist: user,
      art: 'assets/images/components/audio-track.jpg',
      preload: 'metadata'
    };
    this.myTracks.push(audioFile);
  }

}

export class AudioNote implements ITrackConstraint{
  id?: number;
  src: string;
  title?: string;
  artist?: string;
  art?: string;
  preload?: string;
  isUploaded: boolean;
  fileName: string;
}
