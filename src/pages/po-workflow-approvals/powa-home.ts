import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar, AlertController, Events, ToastController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, PowaService, AuthService, Settings } from '../../services/services';
import { PowaModel, PowaType, SubModule } from '../../models/models';
import { PowaDetail } from './powa-detail';

@Component({
  selector: 'powa-home',
  templateUrl: 'powa-home.html',
  providers: [PowaService]
})
export class PowaHome extends BasePage {
  @ViewChild(Searchbar) searchbar: Searchbar;
  Powas: PowaModel[];
  PowasOriginal: PowaModel[];
  PowasSelected: PowaModel[];
  PowasOriginalSingleProgram: PowaModel[];
  type: string;
  toggled: boolean = false;
  searchTerm: string = '';
  allPrograms: boolean;
  multiSelecting: boolean = false;
  groups: any[];
  shownGroup: any;
  approvalsRequested: boolean = false;

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private powaService: PowaService, 
    private app: AppService, private auth: AuthService, private alertCtrl : AlertController, 
    private events: Events, private settings: Settings, private toastCtrl: ToastController) {
    super(loadingCtrl);
    this.Powas = [];
    this.PowasOriginal = [];
    this.PowasOriginalSingleProgram = [];
    this.PowasSelected = [];
    this.type = navParams.data.type;
    this.groups = [];
  }

  ionViewWillEnter(){
    this.settings.load().then(() => {
      this.allPrograms = this.settings.allSettings["allPrograms"];
      if (!this.allPrograms){
        this.allPrograms = false;
      }
    });
  }

  removePowaFromDetail(powa){
    this.removePowaFromList(powa);
    this.showSuccessToast("Your request was processed successfully!");
  }
  
  /*
   * if given group is the selected group, deselect it
   * else, select the given group
   */
  toggleGroup(group){
    this.multiSelecting = false;
    if (this.isGroupShown(group)) {
      this.shownGroup = null;
    } else {
      this.shownGroup = group;
    }
  };

  isGroupShown(group) {
    return this.shownGroup === group;
  };

  ngOnInit(): void {
    this.settings.load().then(() => {
      this.allPrograms = this.settings.allSettings["allPrograms"];
      if (!this.allPrograms){
        this.allPrograms = false;
      }
    });
    this.getPowaData(undefined, true);
    console.log(this.app.programs);
   
  }

  doRefresh(refresher) {
    console.log(`Refresher scrolling... Top:`);
    this.getPowaData(refresher, false);
  }

  doPulling(refresher) {
    console.log('Do Pulling...', refresher.progress);
  }

  getPowaData(refresher, showLoading): void {
    //Call to the backend to get approvals. Uncomment for testing.
    if (showLoading){
      this.app.presentLoading();
    }
    this.powaService.getPendingPOs(this.auth.userInfo.UserId, this.type)
    .then(
      data => {
        if (data.Data.PendingApprovals){
          this.Powas = [];
          this.PowasOriginal = [];
          this.PowasSelected = [];
          this.PowasOriginalSingleProgram = [];
          this.groups = [];
          
          data.Data.PendingApprovals.forEach(pendingApproval => {
            this.PowasOriginal.push(pendingApproval as PowaModel)
            this.Powas.push(pendingApproval as PowaModel)
          });

          if (this.PowasOriginal.length == 0){
            this.approvalsRequested = true;
          }

          if(this.allPrograms){
            this.Powas = this.PowasOriginal.slice();
            this.PowasOriginalSingleProgram = this.PowasOriginal.filter((item) => {
              return (item.projectId == this.app.projectId);
            });
          } else {
            this.Powas = this.PowasOriginal.filter((item) => {
              return (item.projectId == this.app.projectId);
            });
            this.PowasOriginalSingleProgram = this.PowasOriginal.filter((item) => {
              return (item.projectId == this.app.projectId);
            });
          }
          this.checkForPrograms(refresher);
        }
      },
      error => {
        if (refresher){
          refresher.complete();
        }
        console.error(error);
        this.app.dismissLoading();
        this.app.showErrorToast("Oops! An error has occurred fetching the data");
      }
    );
    console.log("Approval type: " + this.type);
  }

  checkForPrograms(refresher){
    if (!this.app.programs){
      this.app.getPrograms().then((programs) => {
        if (refresher){
          refresher.complete();
        }
        let programsAux = programs.filter(program => program.id !== null);
        this.app.programs = programsAux;
        this.app.dismissLoading();
        this.divideIntoGroups(null);
      }, (err) => {
        if (refresher){
          refresher.complete();
        }
        this.dismissLoading();
        console.error(err);
        this.app.showErrorToast("Oops! An issue occurred getting the data.");
      });
    } else {
      if (refresher){
        refresher.complete();
      }
      this.divideIntoGroups(null);
      this.app.dismissLoading();
    }
  }

  divideIntoGroups(shownName){
    var groups = {};
    for (var i = 0; i < this.PowasOriginal.length; i++) {
      //var groupName = this.PowasOriginal[i].projectId;
      var groupObject =  this.app.programs.filter(obj => {
        return obj.id === this.PowasOriginal[i].projectId
      })[0];

      var groupName = "";
      if (groupObject){
        groupName = groupObject.text;
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(this.PowasOriginal[i]);
      }
    }

    for (var groupName in groups) {
      var group = {name: groupName, projectId: groups[groupName][0].projectId, items: groups[groupName]}
      this.groups.push(group);
      if (shownName && shownName == group.name){
        this.shownGroup = group;
      }
    }

    console.log(this.groups);
  }

  toggleSearch() {
    this.toggled = !this.toggled;
    setTimeout(() => {
      if (this.searchbar) this.searchbar.setFocus();
    });
  }

  toggleAllPrograms(){
    this.settings.setValue("allPrograms", this.allPrograms);
    this.settings.save();
    if(this.allPrograms){
      this.Powas = this.PowasOriginal.slice();
    } else {
      this.Powas = this.PowasOriginal.filter((item) => {
        return (item.projectId == this.app.projectId);
      });
    }
  }

  selectAll(group){
    this.PowasSelected = [];
    if (group){
      group.items.forEach(powa => {
        this.PowasSelected.push(powa);
      });
    } else {
      this.PowasOriginal.forEach(powa => {
        this.PowasSelected.push(powa);
      });
    }
  }

  unselectAll(){
    this.PowasSelected = [];
    this.multiSelecting = false;
  }

  allSelected(group){
    let allSelected = true;
    let sellectables = [];
    if (group){
      sellectables = group.items;
    } else {
      sellectables = this.PowasOriginal;
    }
    sellectables.forEach(powa => {
      let index = this.PowasSelected.indexOf(powa);
      if(index == -1){
        allSelected = false;
      }
    });
    return allSelected;
  }

  search(event) {
    // set val to the value of the searchbar
    let val = event.target.value;
    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      console.log(val.toLowerCase());
      if (this.allPrograms){
        if (this.shownGroup){
          var shownName = this.shownGroup.name;
        }
        
        for (var i = 0; i < this.groups.length; i++) {
          var groupItems = this.PowasOriginal.filter((item) => {
            return (((item.SiteNumber.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
            (item.PONumber.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
            (item.SiteName.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
            (item.SFVendorName.toLowerCase().indexOf(val.toLowerCase()) > -1)) && 
            (item.projectId == this.groups[i].projectId));
          });

          if (groupItems) {
            this.groups[i].items = groupItems;
          } else {
            this.groups[i].items = [];
          }

          if (shownName && shownName == this.groups[i].name){
            this.shownGroup = this.groups[i];
          }
        }
      } else {
        this.Powas = this.PowasOriginal.filter((item) => {
          return (((item.SiteNumber.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
          (item.PONumber.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
          (item.SiteName.toLowerCase().indexOf(val.toLowerCase()) > -1) || 
          (item.SFVendorName.toLowerCase().indexOf(val.toLowerCase()) > -1)) && 
          (item.projectId == this.app.projectId));
        });
      }
    } else {
      if(this.allPrograms){
        if (this.shownGroup){
          var shownName = this.shownGroup.name;
        }
        this.groups = [];
        this.Powas = this.PowasOriginal.slice();
        this.divideIntoGroups(shownName);
      } else {
        this.Powas = this.PowasOriginal.filter((item) => {
          return (item.projectId == this.app.projectId);
        });
      }
    }
  }

  isGroup(item) {
    if(item.items){
      return true;
    }
    return false;
  }

  updateListOnBack = (powaToRemove, approve) => {
    return new Promise((resolve, reject) => {
        this.removePowaFromList(powaToRemove);
        this.showSuccessToast("Item " + (approve? "approved": "rejected") + " successfully!");
    });
  }

  itemTapped(event, item) {
    if(!this.multiSelecting){
      this.app.navCtrl.push(PowaDetail, {
        item: item,
        updateListOnBack: this.updateListOnBack
      });
    } else {
      if (this.isItemSelected(item)){
        let index = this.PowasSelected.indexOf(item);
        if(index > -1){
          this.PowasSelected.splice(index, 1);
        }
        if (this.PowasSelected.length == 0){
          this.multiSelecting = false;
        }
      } else {
        this.PowasSelected.push(item);
      }
    }
  }

  processAproval(approve, powa){
    let alert = this.alertCtrl.create({
      title: (approve? "Approve ": "Reject ") + this.getTitle(powa),
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
              if(this.multiSelecting){
                this.powaService.processApprovals(approve, this.PowasSelected, data.reason)
                .then(data=>{
                  this.PowasSelected.forEach(element => {
                    this.removePowaFromList(element);
                  });
                  this.PowasSelected = [];
                  this.multiSelecting = false;
                  this.showSuccessToast("Items " + (approve? "approved": "rejected") + " successfully!");
                  this.app.dismissLoading();
                  console.log(data);
                }, error=>{
                  this.app.showErrorToast("An error occured trying to process your request");
                  this.app.dismissLoading();
                  console.log(error);
                });
              } else {
                let powas = [];
                powas.push(powa);
                this.powaService.processApprovals(approve, powas, data.reason)
                .then(data=>{
                  this.removePowaFromList(powa);
                  this.showSuccessToast("Item " + (approve? "approved": "rejected") + " successfully!");
                  console.log(data);
                  this.app.dismissLoading();
                }, error=>{
                  this.app.showErrorToast("An error occured trying to process your request");
                  this.app.dismissLoading();
                  console.log(error);
                });
              }
            }
          }
        }
      ]
    });
    alert.present();
  }

  removePowaFromList(powa){
    let index = this.Powas.indexOf(powa);
    if(index > -1){
      this.Powas.splice(index, 1);
    }

    index = this.PowasOriginal.indexOf(powa);
    if(index > -1){
      this.PowasOriginal.splice(index, 1);
    }

    if (this.allPrograms){
      index = this.groups[0].items.indexOf(powa);
      if(index > -1){
        this.groups[0].items.splice(index, 1);
        if (this.groups[0].items.length == 0){
          this.groups.splice(0, 1);
        }
      }

      if (this.groups[1]){
        index = this.groups[1].items.indexOf(powa);
        if(index > -1){
          this.groups[1].items.splice(index, 1);
          if (this.groups[1].items.length == 0){
            this.groups.splice(1, 1);
          }
        }
      }
    }
  }

  onLongPress(powa){
    if (!this.multiSelecting || this.Powas.length > 1){
      this.multiSelecting = true;
      console.log("Long Pressed!!!! " + powa.PONumber);
      this.PowasSelected.push(powa);
    }
  }

  getGroupImage(item): string {    
    return "assets/images/dashboard/" + item.text.toLowerCase() + ".svg";
  }

  imageError(event) {
    event.target.onerror = "";
    event.target.src = "assets/images/dashboard/default.svg";
    return true;
  }

  getInitials(text): string {
    return text.replace(/[^A-Z]/g, "").substring(0, 3).toUpperCase();
  }

  isItemSelected(powa) {
    let index = this.PowasSelected.indexOf(powa);
    if (index == -1){
      return false;
    } else {
      return true;
    }
  }

  getIcon(powa) {
    if (this.isItemSelected(powa)){
      return "checkbox";
    } else {
      return "square-outline";
    }
  }

  getTitle(powa): string{
    if (this.type == "PO"){
      if (powa){
        return powa.PONumber;
      } else {
        return "Items";
      }
    } else {
      return "Closeout Cost";
    }
  }

  showSuccessToast(message) {
    let duration:number = 10000;
    let elapsedTime:number = 0;
    let autoClose:boolean=true;
    
    let timeoutHandler = setTimeout( () => { toast.dismiss({autoclose:true}); },duration);
    
    let toast = this.toastCtrl.create({
      message: message,
      showCloseButton: true,
      closeButtonText: "Close",
      cssClass: "toast-info",
      position: 'bottom'
    });
    
    toast.onDidDismiss((data) => {
      clearTimeout(timeoutHandler);
      console.log('time elapsed',data);
        if(!data || !data.autoclose){

        }
    });
    toast.present();
  }

  getApprovalsName(type){
    if (type == "CLOSEOUT"){
      return "Closeout";
    } else {
      return type;
    }
  }

  getSearchPlaceholder(): string{
    return ('Search by Job #, ' + (this.type == 'PO' ? 'PO #, ' : '') + 'Site Name or Vendor');
  }
}
