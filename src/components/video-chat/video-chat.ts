import { Component, ViewChild, NgZone } from '@angular/core';
import { LoadingController, Nav, ModalController, MenuController, NavParams, Events, ViewController, Platform } from 'ionic-angular';
import { AuthService, AppService, Settings, ChatEngineService, UserService } from '../../services/services';
import { UserNotification } from '../../models/models';
import { BaseComponent } from '../base.component';
import TextChatAccPack from 'opentok-text-chat';
import * as $ from 'jquery';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Device } from '@ionic-native/device';
import { Helper } from '../../utils/utils';


declare var OT:any;
declare let cordova:any;
declare let accuv:any;
@Component({
  selector: 'video-chat',
  templateUrl: 'video-chat.html',
  providers: [UserService, Device, Helper]
})
export class VideoChatComponent extends BaseComponent {

  _otCredentials: any;
  _otSession: any;
  _otPublisher: any;
  _otTextChat: any;
  _otTextChatOptions: any;
  roomId:any;
  calleeId: any;
  moduleId: any;
  woSID: any;
  activeSession: boolean = false;
  audioOn: boolean = true;
  videoOn: boolean = true;
  chatOn: boolean = false;
  showChatWindow: boolean = false;
  callStatusData:any;
  callTimeCreated:boolean = false;
  callTimerId:any;
  callAnswerTimeoutId:any;


  @ViewChild(Nav) nav: Nav;
  
  constructor(private helper: Helper,params: NavParams, loadingCtrl: LoadingController, public auth: AuthService, 
    private app: AppService, private modalCtrl: ModalController, private menuCtrl: MenuController,
    private settings: Settings, private chatEngineService: ChatEngineService, private events: Events,private platform: Platform, 
    public viewCtrl: ViewController,private diag: Diagnostic, private device:Device,
    private userService: UserService, private screenOrientation: ScreenOrientation, private zone: NgZone) {
    super(loadingCtrl);
    //if(this.app.platform.is('cordova')) {
    //  this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
    //}
    this.menuCtrl.enable(true);
    this.roomId = params.get("roomId");
    this.calleeId = params.get("calleeId");
    this.moduleId = params.get("moduleId");
    this.woSID = params.get("woSID");
    this.callStatusData = params.get("data");
    
    this._otCredentials = {
      // We receive apiKey, sessionId and token from ChatEngine API controller
      apiKey: null,
      sessionId: null,
      token: null
    };
   
    // Just a  placeholder here. Most of those properties will be populated on init
    this._otTextChatOptions = {
      session: null,
      sender: {
        id: null,
        alias: null,
      },
      limitCharacterMessage: 160,
      textChatContainer: '#chatContainer',
      alwaysOpen: true
     };

  }

  ngAfterViewInit() {
    this.app.presentLoading();
    
    var roomId = this.roomId;
    setTimeout(()=> {
      this.init(roomId);
  
      $('#end-call').on('click',  ()=> {
        this.endCall();
      });
  
    }, 500);
  }

  ngOnDestroy() {
    this.disconnect();
    if(this.app.platform.is('cordova')) {
      this.screenOrientation.unlock();
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }


  init(roomId) {
    if (!roomId){
      roomId = this.woSID + "_" + this.auth.userInfo.UserId.replace(" ", ".");
    }
    this.chatEngineService.getOpenTokSession(roomId).then((result)=> {
      console.log('service initialized!! '+JSON.stringify(result));
      this.activeSession = true;

      this._otCredentials.apiKey = result.OpenTokApiKey;
      this._otCredentials.sessionId = result.OpenTokSessionId;
      this._otCredentials.token = result.OpenTokToken;
      
      this._otTextChatOptions.sender.id = this.auth.userInfo.UserId;
      this._otTextChatOptions.sender.alias = this.auth.userInfo.UserId; // We can provide user name here
      console.log('just before initializing the ot');
        
      this.startCall();
      
      if (this.calleeId){
        var projectId = this.app.projectId;
        var moduleId = this.moduleId;
        var calleeId = this.calleeId;
        var callerId = this.auth.userInfo.UserId;

        var auxParameters =
        {
          workorderSid: this.woSID,
          roomId: roomId,
          a:"'"+this._otCredentials.apiKey+"'",
          c:this._otCredentials.sessionId,
          x:this._otCredentials.token,
          fromDevice:this.device.uuid
        };

        this.inviteUser(projectId, moduleId, calleeId, callerId, auxParameters);
        //me.toggleTextChat(); // Hide text chat on init
      }
        
    }).catch(error=>{console.log(error);
      this.app.dismissLoading();});
    
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
  }

  /**
   * Start publishing video/audio and subscribe to streams
   */
  startCall() {
    var me = this;
   var requestMicAutho = function(me){
      me.diag.isMicrophoneAuthorized().then((micAuthorization) => {
      console.log('isMicrophoneAuthorized:'+micAuthorization);
        if (micAuthorization != true) {
            me.diag.requestMicrophoneAuthorization().then((micAuthorizationResult) => {
                if (micAuthorizationResult == me.diag.permissionStatus.GRANTED) me._startCall();
                else me.app.showAlert("Unable to join the call", "Please try again and make sure to allow microphone access");
            }).catch((e) => {
              me.app.showErrorToast("An error occured trying to check for microphone permission");
                console.error(e);
            });
        } else if (micAuthorization == true) me._startCall();
    }).catch((e) => {
        me.app.showErrorToast("An error occured trying to check if microphone permission has been authorized");
        console.error(e);
    });
  }
   this.diag.isCameraAuthorized().then((camAuthorization) => {
        console.log('isCameraAuthorized: '+camAuthorization);
        if (camAuthorization != true) {
            this.diag.requestCameraAuthorization().then((cameraAuthorizationResult) => {
                if (cameraAuthorizationResult == this.diag.permissionStatus.GRANTED) {
                  requestMicAutho(this);
                } else this.app.showAlert("Unable to join the call", "Please try again and make sure to allow camera access");

            }).catch((e) => {
               this.app.showErrorToast("An error occured trying to check for camera permission");
                console.error(e);
            });
        } else if (camAuthorization == true) requestMicAutho(this);
    }).catch((e) => {
        this.app.showErrorToast("An error occured trying to check if camera permission has been authorized");
        console.error(e);
    }); 
    
  } 

  /**
   * End call
   */
  endCall() {
    clearInterval(this.callTimerId);
    clearTimeout(this.callAnswerTimeoutId);
    if (this._otSession != null){
      this._otSession.unpublish(this._otPublisher);
      this.disconnect();
    } else {
      console.log("OT session object is not initialized.");
    }
    this.runCallStatusCallback("end");
    this.dismiss();
  }

  /*
   * Send push notification to invote a user to the chat
   */  
  inviteUser(projectId, moduleId, calleeUserId, callerUserId, auxParameters = null) {
    let userNotification = new UserNotification();
    userNotification.Projectid = projectId
    userNotification.ModuleId = moduleId;
    userNotification.CalleeUserId = calleeUserId
    userNotification.CallerUserId = callerUserId;
    userNotification.CallerName = this.auth.userInfo.UserName;
    if(auxParameters != null){
      auxParameters.callid = this.helper.generateUUID();
      auxParameters.fromDevice = this.device.uuid;
      auxParameters.fromDevicePlatform = this.platform.is("android") ? "android" : this.platform.is("ios") ? "ios" : "";
      auxParameters.from = callerUserId;
    } 
    else { 
      auxParameters = 
      { 
        callid: this.helper.generateUUID(),
        fromDevice : this.device.uuid,
        fromDevicePlatform: this.platform.is("android") ? "android" : this.platform.is("ios") ? "ios" : "",
        from : callerUserId
      };
    }
      userNotification.AuxParameters = JSON.stringify(auxParameters);
    this.userService.SendChatInviteNotification(userNotification);
  }     

  /**
   * Disconnect otCore from the session
   */
  disconnect() {
    if (this._otSession != null){
      this._otSession.disconnect();
      this._otSession = null;
      this.activeSession = false;
    }
    else {
      console.log("OT session object is not initialized.");
    }
  }

  runCallStatusCallback(status){
    if(status=="end") accuv.plugins.AccuvCallPushMonitor.endCall();
  }
  
  tryToGenerateLabel(){
    if(this.callTimeCreated == false){
      this.callTimeCreated = true;
      var label = document.createElement("span");
      label.id="callTime";
      label.innerText = "00:00";
      label.setAttribute("style","z-index:999999;color:white;font-size:16px;position:absolute;top:1%;left:50%;width:100px;height:20");
      document.getElementById("acc-video-chat").appendChild(label);
      var startTim = new Date();
     this.callTimerId =  setInterval(()=>{
        this.elapsedTime(startTim);
      },1000);
    }
  }

  setAutoEnd(totalConnectionCount:any){
    if(totalConnectionCount <= 1){
      this.app.dismissLoading();
      this.endCall();
    }
  }
  additionalZero(val:any){
    return val.toString().length <= 1 ? "0":"";
  }
   elapsedTime:any =(since:any) => {
    var  elapsed = (new Date().getTime() - since) / 1000;
  
    if (elapsed >= 0) {
      var diff = { hours:0, minutes:0, seconds:0};
  
      diff.hours   = Math.floor(elapsed / 3600 % 24);
      diff.minutes = Math.floor(elapsed / 60 % 60);
      diff.seconds = Math.floor(elapsed % 60);
  
      let message = `${ (diff.hours > 0 ? this.additionalZero(diff.hours) : "") +(diff.hours > 0 ?diff.hours+":":"") }${this.additionalZero(diff.minutes) + diff.minutes+":"}${this.additionalZero(diff.seconds)+diff.seconds}`;
     document.getElementById("callTime").innerText = message;
    }
    else {
      console.log('Elapsed time lesser than 0, i.e. specified datetime is still in the future.');
    }
  };

  private _startCall()
  {
    var me = this;
    this.runCallStatusCallback("start");
    var connectionCount = 0;
    /*
    var publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    
    var subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    */
    this._otSession = OT.initSession(this._otCredentials.apiKey, this._otCredentials.sessionId);

    this._otSession.on({
      streamCreated: (event) => {
        connectionCount++;
        this.app.dismissLoading();

        this._otSession.subscribe(event.stream, 'cameraSubscriberContainer' /*, subscriberOptions*/);
        OT.updateViews();
        this.tryToGenerateLabel();
        console.log('OT Session is created, someone has joined the call');
        console.log("connections = "+ connectionCount);
      },
      streamDestroyed: (event) => {
        connectionCount--;
        console.log(`Stream ${event.stream.name} ended because ${event.reason}`);
        console.log('connections  = '+connectionCount);
        OT.updateViews();
          console.log('firing end call, the call will end with the first stream leaving the room!!!');
          clearInterval(this.callTimerId);
          this.endCall(); 
      },
      /*connectionCreated: function (event) {
        connectionCount++;
        //me._updateVideoContainers(connectionCount);
        console.log(connectionCount + ' connections.');
      },*/
      /*connectionDestroyed: function (event) {
        //connectionCount--;
        //me._updateVideoContainers(connectionCount);
        console.log(connectionCount + ' connections.');
        if(connectionCount <= 1) this.runCallStatusCallback("end");
      },*/
      sessionDisconnected: function sessionDisconnectHandler(event) {
        // The event is defined by the SessionDisconnectEvent class
        connectionCount = 0;
        if(this.callAnswerTimeoutId != null) clearTimeout(this.callAnswerTimeoutId);
        if(this.callTimerId != null) clearInterval(this.callTimerId);
        console.log('Disconnected from the session.');
        if (event.reason == 'networkDisconnected') {
          me.app.showErrorToast('Your network connection terminated.')
        }
        //this.runCallStatusCallback("end");
      }
    });

    this._otSession.connect(this._otCredentials.token, () => {
      this._otPublisher = OT.initPublisher('cameraPublisherContainer' /*, publisherOptions*/);
      this._otSession.publish(this._otPublisher);
      // Hack for opentok.js library provided as part of cordova-plugin-opentok
      if(connectionCount == 0) {
        connectionCount = 1;
        //me._updateVideoContainers(connectionCount);
        this.callAnswerTimeoutId = setTimeout(()=>{
          this.setAutoEnd(connectionCount);
        },45000);
        
        OT.updateViews();
      }

      // For opentok.js from cordova-plugin-opentok. To make it compatible with opentok-solutions-logging.js 
      if(this._otSession.id == undefined) {
        this._otSession.id = this._otSession.sessionId 
      }
      // Put it here for now. Once we are more clear about its usage we can implement idependent methods for start call and open chat
      this._otTextChatOptions.session = this._otSession;
      this._otTextChat = new TextChatAccPack(me._otTextChatOptions);
      if(this._otSession.id != undefined && this._otSession.id != null) this.runCallStatusCallback("connected");
    });
  }
  
  /**
   * Update the size and position of video containers based on the number of publishers and subscribers
   */
   private _updateVideoContainers(connectionsCount) {
    
    const cameraPublisherClass = connectionsCount > 1 ? 'video-container small' : 'video-container';
    document.getElementById('cameraPublisherContainer').setAttribute('class', cameraPublisherClass);

    const cameraSubscriberClass = connectionsCount == 1 ? 'video-container hidden' : 'video-container';
    document.getElementById('cameraSubscriberContainer').setAttribute('class', cameraSubscriberClass);
  }
  
  /**
   * Toggle chat window
   */
  toggleChatWindow = function () {
    this.showChatWindow = !this.showChatWindow;
  };
  toggleLocalAudio() {
    this._otPublisher.publishAudio(!this.audioOn);
    this.audioOn = !this.audioOn;
    this.zone.run(() => console.log("refreshing audio icon"))
  };

  toggleLocalVideo() {
    this._otPublisher.publishVideo(!this.videoOn);
    const action = this.videoOn ? 'add' : 'remove';
    this.videoOn = !this.videoOn;
    this.zone.run(() => console.log("refreshing video icon"))
  };

  toggleTextChat() {
    if(this._otTextChat != null) {
      if(!this._otTextChat.isDisplayed())
        this._otTextChat.showTextChat();
      else      
        this._otTextChat.hideTextChat();  
      }
    else
      console.log("OT Text Chat object is not initialized.");
  };
  
  /*
  toggleTextChat() {
    const textChat = this._otCore.getAccPack('textChat');
    if(!textChat.isDisplayed())
      textChat.showTextChat();
    else      
      textChat.hideTextChat();  
  };
  */

  getButtonsClass(): string {
    if (this.activeSession){
      return "videochat-button";
    } else {
      return "disabled-button";
    }
  }

}
