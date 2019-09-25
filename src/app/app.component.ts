import { Component } from '@angular/core';
import { Platform, Events, LoadingController, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Device } from '@ionic-native/device';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AppCenterAnalytics } from '@ionic-native/app-center-analytics';
import { AppCenterPush } from '@ionic-native/app-center-push';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { AppService } from '../services/common/app.service';
import { AuthService } from '../services/common/auth.service';
import { GeoService } from '../services/common/geo.service';
import { Settings } from '../services/common/settings.service';
import { UserService } from '../services/common/user.service';
import { WorkOrderService } from '../services/work-order/work-order.service';
import { Helper } from '../utils/utils';
import { AppConfig } from './config/app.config'
import { InAppBrowser } from '@ionic-native/in-app-browser';


//Entry points pages and components
import { Home } from '../pages/home/home';
import { ProgramSelector } from '../components/program-selector/program-selector';
import { DfrListTabs } from '../pages/daily-field-report/dfr-list-tabs';
import { DviListTabs } from '../pages/daily-vehicle-inspection/dvi-list-tabs';
import { About } from '../pages/about/about';
import { DashboardHome } from '../pages/dashboard/dashboard-home';
import { AlertController } from 'ionic-angular';
import { Modules, SubModule, UserDevice} from '../models/models';
import { ApprovalSwitch } from '../pages/po-workflow-approvals/approval-switch';
import { WorkOrderHome } from '../pages/work-order/work-order-home';
import { WCIStart } from '../pages/warehouse-check-in/wci-start';
import { VideoQaSectorsPage } from '../pages/video-qa/video-qa-sectors';
import { RMSiteSearch } from '../pages/receive-materials/rm-search';
import { RMHome } from '../pages/receive-materials/rm-home';
import { VideoChatComponent } from '../components/video-chat/video-chat';
import { WorkOrderCONListTabs } from '../pages/work-order/wo-construction/wo-con-list-tabs';
import { WorkOrderTabs } from '../models/work-order/work-order.model';
import { WorkOrderCONForm } from '../pages/work-order/wo-construction/wo-con-form';
import { Accuv } from '../pages/accuv/accuv';
import { ProgramFeatures } from '../models/common/features.model';
import { FeaturesAccessService } from '../services/common/features-access.service';


declare let cordova: any;
declare let accuv:any;
declare let VoipPush:any;
var vfix = false;
var icfix = false;
var hasAuthenticated = false;
var phoneAccountAccessConfirm = null
@Component({
  templateUrl: 'app.html',
  providers: [Push, UserService, Device, VideoChatComponent, WorkOrderService, FeaturesAccessService]
})
export class MyApp {
  rootPage: any;
  pages: Array<{ title: string, icon: string, component: any, moduleId: number }>;
  defaultPages: Array<{ title: string, icon: any, component: any, moduleId: number }>;
  supportedModules: Array<{ icon: any, component: any, moduleId: string, id: number, titleOverride: any }>;
  userName: string;
  projectName: string;
  isApp: boolean;
  public alertShown: boolean = false;
  switchProgramModal: any;
  programModal = this.modalCtrl.create(ProgramSelector, { showClose: false });
  pushInitialized:boolean = false;
  private isChangePasswordButtonVisible: boolean;
  
  constructor(private iab: InAppBrowser, private platform: Platform, private device: Device, private auth: AuthService, private app: AppService, private events: Events,
    private statusBar: StatusBar, private splashScreen: SplashScreen, private loadingCtrl: LoadingController,
    private helper: Helper, private modalCtrl: ModalController, private settings: Settings, private appConfig: AppConfig,
    	private alertCtrl: AlertController, 
		private geo: GeoService, 
		private appCenterAnalytics: AppCenterAnalytics,
    	private appCenterPush: AppCenterPush,
		private push: Push,
    private userService: UserService,
    private workOrderService : WorkOrderService,
    private featuresAccessService: FeaturesAccessService
    		) {
    console.log('AppConfig', this.appConfig);
    
    //Events handling
    // LOGIN
    this.events.subscribe('user:login', () => {
      
      console.log("User logged-in!");
      this.app.timeoutDialogShown = false;
      this.splashScreen.hide();
      this.rootPage = Home;
    });

    // USER INFO SET
    this.events.subscribe('user:infoSet', (userInfo) => {
      console.log("User info set!");
      this.userName = userInfo.UserName;
      this.isChangePasswordButtonVisible = userInfo.LocalAuth;
      this.app.dismissLoading();
      
      //Navigate to Home page once the userinfo is set
      //Check the default program, if there is not default show the program selector
      if (!userInfo.DefaultView) {
        let modal = this.modalCtrl.create(ProgramSelector, { showClose: false });
        modal.present();
      } else {
        let projectId = this.helper.getParameterByName("projectId", userInfo.DefaultView);
         //TODO: fetch the programs to get the name, we have to implement a new operation in the server with a better performance
        this.updateProgram(projectId, projectId);
      }

      this.initPushes();
							
    });

    // PROGRAM SWITCH
    this.events.subscribe('program:switch', (program) => {
      console.log(`Re-load app for program: ${program.id}`);
      this.updateProgram(program.text, program.id);
    });

    // TOKEN EXPIRED
    this.events.subscribe('token:expired', () => {
      console.log("JWT token has expired!");
      if (!this.app.timeoutDialogShown) {
        this.app.timeoutDialogShown = true;
        this.app.showAlert("Session Expired", "Your session has expired. Please login again.");
        this.doLogoff();
      }
    });

    //Initialize App!
    this.splashScreen.show();
    this.initializeApp();

    this.projectName = this.app.projectName;
    this.userName = "Not logged-in";

    //Used for navigation on the side menu
    this.pages = [];

    this.defaultPages = [
      { title: 'Home', icon: { type: 'fa', name: 'home' }, component: Home, moduleId: Modules.WorkflowApplication },
      { title: 'Dashboards', icon: { type: 'fa', name: 'tachometer' }, component: DashboardHome, moduleId: Modules.Dashboard }
    ];

    //Supported modules on mobile, this is validated then with the user permissions
    this.supportedModules = [
      { icon: { type: 'fa', name: 'id-card-o' }, component: DfrListTabs, moduleId: Modules.DailyFieldReport.toString(), id: Modules.DailyFieldReport, titleOverride: null },
      { icon: { type: 'fa', name: 'car' }, component: DviListTabs, moduleId: Modules.DailyFieldReport.toString() + "_DVI", id: Modules.DailyVehicleInspection, titleOverride: null },
      { icon: { type: 'custom', name: 'Receiving.svg' }, component: RMHome, moduleId: Modules.ReceiveMaterials.toString(), id: Modules.ReceiveMaterials, titleOverride: null },
      { icon: { type: 'fa', name: 'wrench' }, component: WorkOrderHome, moduleId: Modules.WorkOrder.toString(), id: Modules.WorkOrder, titleOverride: null },
      { icon: { type: 'fa', name: 'clipboard' }, component: WCIStart, moduleId: Modules.WarehouseCheckIn.toString(), id: Modules.WarehouseCheckIn, titleOverride: null },

      // Removing Approvals module because it doesn't have to go to the side menu at least for the moment.
      //{ icon: 'tachometer', component: ApprovalSwitch, moduleId: Modules.POWorkflowApprovals.toString(), id: Modules.POWorkflowApprovals, titleOverride: "Approvals" }
      { icon: 'wechat', component: VideoChatComponent, moduleId: Modules.ChatEngine.toString(), id: Modules.ChatEngine, titleOverride: null },
    ];
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      if (this.app.isApp()) {
        cordova.plugins.certificates.trustUnsecureCerts(true);
      }

      if (this.app.isAndroid()){
        this.statusBar.backgroundColorByHexString("#FF000000");
        this.statusBar.styleLightContent();
      } else {
        this.statusBar.styleDefault();
      }
      
      //This also has a side effect of unable to close the app when on the rootPage and using the back button.
      //Back button will perform as normal on other pages and pop to the previous page.
      this.platform.registerBackButtonAction(() => {
        if (this.alertShown == false) {
          if (this.app.navCtrl.canGoBack()) {
            this.app.navCtrl.pop();
          } else {
            this.presentConfirm();
          }
        }
      });
      
      this.geo.watchGeolocation();
      
      await this.checkForUpdates(false);

      // if(this.app.isApp()) {
      //   this.appCenterPush.setEnabled(true).then(() => {
      //     this.appCenterPush.addEventListener('My Event').subscribe(pushNotification => {
      //         console.log('Recived push notification', pushNotification);
      //     });
      //  });
      // }

      
      //Perform login
      if (this.auth.isLoggedIn()) {
        this.events.publish('user:login');
      }else{
        // Only used for local development
        // this.auth.verifyLoginCallback().then(isCallback=>{
        //   if(!isCallback){
        //     this.auth.startAuthentication();
        //   }
        // });
         this.auth.startAuthentication();
      }
    });
  }
  
  changePassword() {
    var inAppPage = cordova.InAppBrowser.open(this.app.config.identityServerURL + '/Account/ChangePassword/?returnUrl=' + this.app.config.redirectURI+'/', '_blank', 'location=no','zoom=no');
    let refVariable = this.app;
    inAppPage.addEventListener('loadstart', function(event) { 
      inAppPage.show();
      var urlSuccessPage = refVariable.config.redirectURI+'/';
      if (event.url == urlSuccessPage) {
          inAppPage.close();
          refVariable.showSuccessToast("Password Changed Successfully!");
         }
     });
    }

  initPushes(){
    if (!this.pushInitialized){
        //only for ios
        if(this.platform.is('ios'))
        this.initVoipPushNotificationForIOS();

        //for both platforms
        this.initPushNotification();
      }
  }
  
  navigateToWorkOrder(woSid, woStatus = WorkOrderTabs.Issued, woProjectId, payload = { woTab : "form"}, callback=null){  
   var me = this;
    if(this.app.projectId !=woProjectId){
      this.updateProgram(woProjectId,woProjectId);
    }
    this.app.moduleId = Modules.WorkOrder;
    this.workOrderService.getWorkOrderBySid(woSid).then(wo=>{
        if(wo){
          this.app.navCtrl.push(WorkOrderCONListTabs, {  tab: woStatus}).then(()=>{
            this.app.navCtrl.push(WorkOrderCONForm, {  item:wo, page:payload.woTab,"parentPage":WorkOrderCONListTabs }).then(()=>{
              if(typeof(callback) == 'function') callback();
            });
          }) 
        }
      },function(err){
        console.log('An error hapened trying to get the specified work order ');
        console.log(err);
  
      });
    this.helper.ifModalClose(this.switchProgramModal);
    this.helper.ifModalClose(this.programModal);
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    console.log(`Opening module: ${page.title}`);
    this.app.trackEvent(`OPEN: ${page.title}`, {});
    this.app.navCtrl.setRoot(page.component);
    this.app.moduleId = page.moduleId;
  }

  
  doLogoff() {
    this.splashScreen.show();

    this.auth.logout().then(async () => {
      console.log("User logged-out successfully!");
      this.events.publish('user:logout');
      this.app.trackEvent("LOGOUT", {});
      setTimeout(() => {
        //Hack to clear home screen when logging out (should be using observables)
        this.app.navCtrl.setRoot(Home);
        this.auth.startAuthentication();
      },2000);
    }, (err) => {
      console.error(err);
      this.splashScreen.hide();
      this.app.showErrorToast("Oops! An issue occurred on logout");
    });
  }

  switchProgram() {
    let modal = this.modalCtrl.create(ProgramSelector);
    this.switchProgramModal = modal;
    modal.present();
  }

  updateProgram(projectText: string, projectId: string){
    this.projectName = projectText;
    this.app.projectId = projectId;
    this.app.projectName = projectText;
    this.loadProjectInformation();
    this.app.navCtrl.setRoot(Home);
    this.setupFeatureConfig();
  }

  openAbout() {
    this.app.navCtrl.setRoot(About);
  }

  async checkForUpdates(showNoUpdate: boolean) {
    let updateModel = await this.app.checkAppUpdate();
    if (updateModel.Update) {    
      //Hack to dispaly modal overtop splash
      this.app.navCtrl.setRoot(Accuv);
      this.splashScreen.hide();

      return new Promise(async (resolve) => {
        let confirm = this.app.alertCtrl.create({
          title: 'New version available!',
          message: `<p>You currently have an older version of AccuV app. Please download new version by clicking on 'Install' button below to continue using mobile application.</p>`,
          enableBackdropDismiss: false,
          buttons: [
            {
              text: 'Install',
              handler: () => {
                console.log('Agree clicked!');
                const browser = window.location.href = this.app.config.installEndpoint;
                return resolve(false);
              }
            }
          ]
        });
        await confirm.present();
      });
    } else {
      if (showNoUpdate == true) {
        return new Promise(async (resolve) => {
          let confirm = await this.app.alertCtrl.create({
            title: 'App Update',
            message: '<p>You are up to date!</p>',
            buttons: [
              {
                text: 'Ok',
                handler: () => {
                  console.log('Ok clicked');
                  return resolve(true);
                }
              }
            ]
          });
          await confirm.present();
        });      
      }
    }
  }

  presentConfirm() {
    let alert = this.alertCtrl.create({
      title: 'Confirm Exit',
      message: 'Do you really want to Exit?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            this.alertShown = false;
          }
        },
        {
          text: 'Yes',
          handler: () => {
            console.log('Yes clicked');
            this.platform.exitApp();
          }
        }
      ]
    });
    alert.present().then(() => {
      this.alertShown = true;
    });
  }

  private getItemsAndBuildMenu() {
    console.log("Fetching menu items...");
    this.app.getMenuItems().then((data) => {
      this.auth.getUserSubModules()
        .then((subModules) => {
          this.app.dismissLoading();
          this.app.subModules = subModules;
          console.log(data);
          console.log("Building menu...");
          this.pages = Array.from(this.defaultPages);
          this.buildSideMenu(data);
        }, (err) => {
          this.app.dismissLoading();
          console.log(data);
          console.log("Building menu...");
          this.pages = Array.from(this.defaultPages);
          this.buildSideMenu(data);
        });
    });
  }

  private buildSideMenu(data: any) {
    let menu = data[0];
    if (!menu || !menu.items) {
      console.log("No items to show on side menu");
      return;
    }
    //Clean module permissions
    this.app.modulesPermission = [];

    let items = menu.items as Array<any>[];

    this.supportedModules.forEach(supportedModule => {
      let item = items.filter((item) => {
        let moduleId = item["moduleId"];
        let subModule = item["subModuleId"];
        if (subModule) moduleId = moduleId + "_" + subModule;

        //Right now only POWorkflowApprovals works with the submodules permissions, in the future
        //we might update this logic to be less specific to a module.
        if (supportedModule.moduleId == Modules.POWorkflowApprovals.toString()) {
          if (moduleId == supportedModule.moduleId &&
            (this.app.hasSubModulePermission(SubModule.POs) || this.app.hasSubModulePermission(SubModule.Closeouts))) {
            return item;
          }
        } else {
          if (moduleId == supportedModule.moduleId) {
            return item;
          }
        }
        return null;
      })[0];

      if (item) {
        this.pages.push({
          title: supportedModule.titleOverride ? supportedModule.titleOverride : item["text"],
          icon: supportedModule.icon,
          component: supportedModule.component,
          moduleId: supportedModule.id
        });
        this.app.modulesPermission.push({
          moduleId: supportedModule.id,
          access: true
        });
        return true;
      } else {
        this.app.modulesPermission.push({
          moduleId: supportedModule.id,
          access: false
        });
      }

      //This is to handle the Dashboards menu once they are supported on mobile
      // if (supportedModule.moduleId == Modules.Dashboard) {
      //   this.pages.push({
      //     title: "Dashboards",
      //     icon: supportedModule.icon, 
      //     component: supportedModule.component, 
      //     moduleId: supportedModule.moduleId
      //   });
      // }

    });
    console.log("Menu ready!");
  }

  private loadProjectInformation() {
    this.app.presentLoading();
    this.auth.setAdditionalUserInfoFromDBUsingProjectId(this.app.projectId)
      .then((project) => {
        console.log(`Project Information successfully loaded! User: ${project.UserName} - Program: ${this.app.projectId}`);
        this.events.publish('user:session', project);
        this.getItemsAndBuildMenu();
      }, (err) => {
        this.app.dismissLoading();
        console.error(err);
        this.app.showErrorToast('Oops! An issue occurred loading project.');
      });
  }

  initVoipPushNotificationForIOS(){
    this.pushInitialized = true;
    var pushObj = new VoipPush();//VoIPPushNotification.init();
    var callMonitor = accuv.plugins.AccuvCallPushMonitor;
    callMonitor.on('hangup', function(){ vfix = false; icfix=false;  });
    callMonitor.on('reject', function(){ vfix = false; icfix=false; });
    callMonitor.on('answer',(answerData)=>{
        var dataFormatted = this.helper.transformVoipJsonData(answerData, (this.helper.isNullOrUndefinedOrEmpty(answerData) != true && answerData.hasOwnProperty('aps') ) );
        console.log('call answered!!');
        this.goToNotifiedPage(dataFormatted);
    });

    pushObj.register((data)=>{
     let userDevice = new UserDevice();
     userDevice.DeviceToken = data.token;
     userDevice.UserId = this.auth.userInfo.UserId;
     userDevice.DevicePlatform = 'ios';
     userDevice.DeviceId = this.device.uuid;
     userDevice.DeviceTokenType = 'voip';
     console.log(data);
     this.userService.RegisterUserDevice(userDevice);  
    
    }, (data)=>{
       if(icfix != true) {
         icfix = true;
         var incomingCallMessage = (data != null && data.payload != null && data.payload.aps != null && data.payload.aps.alert != null ) ? data.payload.aps.alert.body : 'Incoming call from AccuV';
         callMonitor.receiveCall(incomingCallMessage, data.payload);
       }
     });
 }

  initPushNotification() {
    if (!this.platform.is('cordova')) {
      console.warn('Push notifications not initialized. Cordova is not available - Run in physical device');
      return;
    }
    var me= this;
    this.pushInitialized = true;
    console.log('Platform is cordova');
    var callMonitor = accuv.plugins.AccuvCallPushMonitor;
    ;
    //cordovaCall.setVideo(true);

    const options: PushOptions = {
      android: {
        senderID: this.appConfig.fcmSenderId,
        sound: true,
        vibrate: true,
        forceShow: true
      },
      ios: {
        alert: true,
        badge: false,
        sound: true
      },
      windows: {}
    };

    const pushObject: PushObject = this.push.init(options);

    this.push.createChannel({
      id: "video_call",
      description: "Video Call",
      importance: 5,
    }).then(() => console.log('Channel created'));
    
    pushObject.on('registration').subscribe((data: any) => {
      console.log('device token -> ' + data.registrationId);
      let userDevice = new UserDevice();
      userDevice.DeviceToken = data.registrationId;
      userDevice.UserId = this.auth.userInfo.UserId;
      userDevice.DevicePlatform = this.app.isAndroid()? 'android': this.app.isiOS()? 'ios': 'unsupported';
      userDevice.DeviceId = this.device.uuid;
      userDevice.DeviceTokenType = 'apns';
      this.userService.RegisterUserDevice(userDevice);
      callMonitor.configCallLog(this.app.config.apiEndpoint,userDevice.UserId, userDevice.DeviceId);
    });

    callMonitor.on('hangup', function(){ vfix = false; icfix=false;  });
    callMonitor.on('reject', function(){ vfix = false; icfix=false; });
    callMonitor.on('answer',(answerData)=>{
        this.goToNotifiedPage(answerData);
    });

    pushObject.on('notification').subscribe((data: any) => {
      console.log('message -> ' + data.message);
      var _me = me;
      //if user using app and push notification comes for video call only do as follow
      if (data.additionalData.foreground && ( this.helper.isNullOrUndefinedOrEmpty(data.additionalData.android_channel_id) != true && data.additionalData.android_channel_id == 'video_call')) {
          if(icfix != true) {
            icfix = true;
            callMonitor.receiveCall(data.message, data);
          }
      } else {
        //if user NOT using app and push notification comes
        console.log('Push notification clicked');
        this.goToNotifiedPage(data);
      }
    });

    pushObject.on('error').subscribe(error => console.error('Error with Push plugin' + error));
  }

  parseDataIosAndroidCompatible(data){
    var resultData = {woSid:null,pid:null,d:null,mid:null,roomId:null};
    if(this.helper.isNullOrUndefinedOrEmpty(data.additionalData)){
      resultData.pid = data.projectId;
      resultData.d = data;
      resultData.mid = data.moduleId;
      resultData.roomId = data.roomId;
      console.log("this is the log");
      if(data.hasOwnProperty("auxParameters") && !data.auxParameters.hasOwnProperty("workorderSid")){
        var auxParams = JSON.parse(data.auxParameters);
        resultData.woSid = auxParams.workorderSid;
      }else  if(data.hasOwnProperty("auxParameters") && data.auxParameters.hasOwnProperty("workorderSid")){
        resultData.woSid = data.auxParameters.workorderSid;
      }
  }else{
    resultData.woSid = this.helper.isNullOrUndefinedOrEmpty(data.additionalData.auxParameters.workorderSid) ? data.additionalData.auxParameters.workOrderSid : data.additionalData.auxParameters.workorderSid;

    if(this.helper.isNullOrUndefinedOrEmpty(resultData.woSid )){
      if(data.additionalData.hasOwnProperty("auxParameters") && !data.additionalData.auxParameters.hasOwnProperty("workOrderSid")){
        var auxParams = JSON.parse(data.additionalData.auxParameters);
        resultData.woSid = auxParams.workOrderSid;
      }else  if(data.additionalData.hasOwnProperty("auxParameters") && data.additionalData.auxParameters.hasOwnProperty("workOrderSid")){
        resultData.woSid = data.additionalData.auxParameters.workOrderSid;
      }
    }
    resultData.pid = data.additionalData.projectId;
    resultData.d = data.additionalData;
    resultData.mid = data.additionalData.moduleId;
    resultData.roomId = data.additionalData.roomId;
  }

  return resultData;
  }

  navigateAndShowCall(data){
    console.log("navigate and show a call");
    var resultData = this.parseDataIosAndroidCompatible(data);
    resultData.d.woTab = "form";
    this.navigateToWorkOrder(resultData.woSid, WorkOrderTabs.InProgress, resultData.pid , resultData.d, ()=>{
      this.joinACall(resultData.roomId, resultData.mid);
    });
    
  }

  navigateForTextMessagePrePost(data){
    var resultData = this.parseDataIosAndroidCompatible(data);
    resultData.d.woTab = "logs";
    this.navigateToWorkOrder(resultData.woSid, WorkOrderTabs.InProgress, resultData.pid, resultData.d);
  }

  joinACall(roomId, moduleId){
    let modalVideoChat = this.modalCtrl.create(VideoChatComponent, { roomId : roomId,  moduleId: moduleId});
    modalVideoChat.present();
      
  }

  goToNotifiedPage(data){
    if (!this.auth.isLoggedIn()) {
      console.log('not authenticated lets try to authenticate subscribe waiting for the authentication event to fire');
      //subscribe to user session event when user login
      this.events.subscribe('user:infoSet', () => {
        this.events.unsubscribe('user:infoSet');
        this.goToNotifiedPage(data);
      });

    } else{ 
      switch(data.title){
        case "Pre-Log Sent":
        case "Post-Log Sent":
         this.navigateForTextMessagePrePost(data);
          break;
        case "AccuV Video Call":
          this.navigateAndShowCall(data);
          break;
        default:
        console.log("tapped on notification");
      }
    }
  }


  setupFeatureConfig() {
    var matchingConfig: ProgramFeatures;
    var defaultConfig: ProgramFeatures;

    this.featuresAccessService.getFeaturesConfigFile().then(
      data => {
        var programFeatures = data as ProgramFeatures[];
        programFeatures.forEach(item => {
          if (this.app.projectId == item.program){
            matchingConfig = item;
          } else if (item.program == "DEFAULT"){
            defaultConfig = item;
          }
        });
        this.app.programFeatures = matchingConfig ? matchingConfig : defaultConfig;
      },
      error => {
        console.error(error);
      }
    );
  }
}
