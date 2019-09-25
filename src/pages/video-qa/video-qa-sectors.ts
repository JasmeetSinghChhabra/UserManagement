import { Component, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { IonicPage, NavController, NavParams, LoadingController, Nav } from 'ionic-angular';
import { AppConfig } from '../../app/config/app.config'
import { AppVersion } from '@ionic-native/app-version';
import { BasePage } from '../base.page';
import { WorkOrderService, AppService } from '../../services/services';
import { VideoQaChecklistPage } from './video-qa-checklist';
import { VQAItem, VQAStatus, VQAStatusBE } from '../../models/video-qa/vqa.model';

/**
 * Generated class for the VideoQaLandingPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'video-qa-sectors',
  templateUrl: 'video-qa-sectors.html',
  providers: [WorkOrderService]
})
export class VideoQaSectorsPage extends BasePage {

  @ViewChild(Nav) nav: Nav;
  groups: VQAItem[];
  groupsFiltered: VQAItem[];
  equipmentType: any;
  shownGroups: any[];
  showExpandableSectors: boolean = false;
  filteringVQA: number = -1;
  woSID: number;
  woType: number;

  constructor(loadingCtrl: LoadingController, public navCtrl: NavController, public navParams: NavParams,
    private http: Http, private appConfig: AppConfig, private appVersion: AppVersion, 
    private workOrderService: WorkOrderService, private app: AppService) {
    super(loadingCtrl);

    this.equipmentType = navParams.get('equipmentType');
    this.woSID = navParams.get('woSID');
    this.woType  = navParams.get('woType');
    this.shownGroups = [];
    this.groups = [];

    this.groups = this.equipmentType.Childs;
    this.calculateVQAStats();

    this.groupsFiltered = JSON.parse(JSON.stringify(this.groups)) as VQAItem[];
    if (this.groups && this.groups.length > 0
      && this.groups[0].Childs && this.groups[0].Childs.length > 0
      && this.groups[0].Childs[0].Childs && this.groups[0].Childs[0].Childs.length > 0){
        this.showExpandableSectors = true;
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad VideoQaLandingPage');
  }

  ionViewWillEnter(){
    this.calculateVQAStats();
    this.groupsFiltered = JSON.parse(JSON.stringify(this.groups)) as VQAItem[];
    this.reFilterGroups();
  }

  toggleGroup(group){
    if (this.isGroupShown(group)) {
      this.shownGroups.splice(this.shownGroups.indexOf(group), 1);
    } else {
      this.shownGroups.push(group);
    }
  };

  isGroupShown(group) {
    return (this.shownGroups.filter(a => a.Name == group.Name)).length > 0;
  };

  toggleAllGroups(){
    if (this.allGroupsShown()) {
      this.shownGroups = [];
    } else {
      this.shownGroups = [];
      this.shownGroups = this.shownGroups.concat(this.groupsFiltered);
    }
  };

  allGroupsShown() {
    return this.groupsFiltered.length == this.shownGroups.length;
  };

  itemTapped(event, group, position, hasNoPositionChild: boolean){
    let checklist;
    let title;
    if (hasNoPositionChild){
      checklist = this.getPositionsAux(this.groups, position);
      title = position.Name;
    } else {
      let auxGroup = this.getPositionsAux(this.groups, group);
      checklist = this.getPositionsAux(auxGroup.Childs, position);
      title= group.Name + " - " + position.Name;
    }

    this.app.navCtrl.push(VideoQaChecklistPage, {
      checklist: checklist.Childs,
      title: title,
      equipmentType: this.equipmentType,
      woSID: this.woSID,
      woType: this.woType
    });
  }

  calculateVQAStats(){
    this.groups.forEach(positions => {
      this.clearStats(positions);
      if (positions.Childs && positions.Childs.length > 0){
        positions.Childs.forEach(items => {
          if (items.Childs && items.Childs.length > 0){
            this.clearStats(items);
            items.Childs.forEach(item => {
              //4 levels
              //First add total to the 1st level of the tree
              this.addVQAItemsToTotal(positions, item);

              //Then, add total to the next level of the tree (in order to know what icon to display)
              this.addVQAItemsToTotal(items, item);
            });
          } else {
            //3 levels
            this.addVQAItemsToTotal(positions, items);
          }
        });
      } else {
        //2 levels
        this.addVQAItemsToTotal(positions, positions);
      }
    });
  }

  clearStats(vQAItem: VQAItem){
    vQAItem.TotalItems = 0;
    vQAItem.ApprovedItems = 0;
    vQAItem.RejectedItems = 0;
    vQAItem.UploadedItems = 0;
    vQAItem.PendingItems = 0;
  }

  addVQAItemsToTotal(positions: VQAItem, element: VQAItem){
    positions.TotalItems++;
    switch(element.Status){
      case VQAStatusBE.Approved:
      positions.ApprovedItems++;
      break;
      case VQAStatusBE.Rejected:
      positions.RejectedItems++;
      break;
      case VQAStatusBE.Uploaded:
      positions.UploadedItems++;
      break;
      case VQAStatusBE.Pending:
      positions.PendingItems++;
      break;
    }

    if (!element.Status){
      positions.PendingItems++;
    }
  }

  filterGroups(index){
    this.shownGroups = [];
    this.groupsFiltered = JSON.parse(JSON.stringify(this.groups)) as VQAItem[];
    if (this.filteringVQA == index){
      console.log("Removed filter!");
      this.filteringVQA = -1;
    } else {
      console.log("Filtering...");
      this.matchFilter(index);
      this.filteringVQA = index;
    }
  }

  reFilterGroups(){
    if (this.filteringVQA != -1 ){
      this.shownGroups = [];
      console.log("Filtering...");
      this.matchFilter(this.filteringVQA);
    }
  }

  getItemsAmountByStatus(item: VQAItem){
    switch(this.filteringVQA){
      case VQAStatus.Pending:
      return item.PendingItems;
      case VQAStatus.Approved:
      return item.ApprovedItems;
      case VQAStatus.Rejected:
      return item.RejectedItems;
      case VQAStatus.Uploaded:
      return item.UploadedItems;
      case -1:
      return item.TotalItems;
    } 
  }

  matchFilter(status){
    if (this.groupsFiltered){
      let filteredListAux: VQAItem[] = JSON.parse(JSON.stringify(this.groupsFiltered));
      this.groupsFiltered.forEach(positions => {
        switch(status){
          case VQAStatus.Pending:
            this.statusFilter(status, positions, filteredListAux, positions.PendingItems);
          break;
          case VQAStatus.Approved:
            this.statusFilter(status, positions, filteredListAux, positions.ApprovedItems); 
          break;
          case VQAStatus.Rejected:
            this.statusFilter(status, positions, filteredListAux, positions.RejectedItems);
          break;
          case VQAStatus.Uploaded:
            this.statusFilter(status, positions, filteredListAux, positions.UploadedItems);
          break;
        } 
      });

      this.groupsFiltered = JSON.parse(JSON.stringify(filteredListAux));
    }
  }

  statusFilter(status: number, positions: VQAItem, filteredListAux: VQAItem[], statusAmount: number){
    if (statusAmount == 0){
      filteredListAux.splice(filteredListAux.indexOf(this.getPositionsAux(filteredListAux, positions)), 1);
    } else {
      let positionsAux = this.getPositionsAux(filteredListAux, positions);
      this.iterateItemAndFilter(filteredListAux, status, positions, positionsAux);
    }
  }

  getPositionsAux(filteredListAux: VQAItem[], positions: VQAItem): VQAItem{
    return filteredListAux.filter(element => element.Name == positions.Name )[0];
  }

  iterateItemAndFilter(filteredListAux, status, positionsReal: VQAItem, positionsAux: VQAItem) {
      if (positionsReal.Childs && positionsReal.Childs.length > 0){
        positionsReal.Childs.forEach(position => {
          if (position.Childs && position.Childs.length > 0){
            let positionAux = this.getPositionsAux(positionsAux.Childs, position);
            position.Childs.forEach(item => {
              if (this.isDifferentToFilter(item.Status, status)){
                this.cleanItemForFilter(positionAux, item);
              }
            });
            if (positionAux.Childs.length == 0){
              positionsAux.Childs.splice(positionsAux.Childs.indexOf(positionAux), 1);
            } 
          } else {
            if (this.isDifferentToFilter(position.Status, status)){
              this.cleanItemForFilter(positionsAux, position);
            }
          }
        });
        if (positionsAux.Childs.length == 0){
          filteredListAux.splice(filteredListAux.indexOf(positionsAux), 1);
        }
      }
  }

  cleanItemForFilter(parentItem: VQAItem, item: VQAItem){
    let index = parentItem.Childs.indexOf(item);
    parentItem.Childs.splice(index, 1);
  }

  isDifferentToFilter(itemStatus: string, filterStatus: number): boolean{
    switch(filterStatus){
      case VQAStatus.Pending:
        return itemStatus != VQAStatusBE.Pending && itemStatus != null;
      case VQAStatus.Approved:
        return itemStatus != VQAStatusBE.Approved;
      case VQAStatus.Rejected:
        return itemStatus != VQAStatusBE.Rejected;
      case VQAStatus.Uploaded:
        return itemStatus != VQAStatusBE.Uploaded;
    }
  }

  getSectorProgress(sector){
    return ((sector.ApprovedItems / sector.TotalItems) * 100);
  }

  getIconName(position){
    return position.TotalItems ? (position.TotalItems == position.ApprovedItems ? "checkbox" : "warning") : "warning";
  }

  getStatus(position){
    return position.TotalItems ? (position.TotalItems == position.ApprovedItems ? "status-approved" : "status-pending") : "status-pending";
  }

  getFilterIconName(index){
    if (index == this.filteringVQA){
      return "check-square-o";
    } else {
      return "square-o";
    }
  }

}
