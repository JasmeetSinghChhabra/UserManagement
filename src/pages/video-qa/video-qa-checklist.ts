import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppService } from '../../services/services';
import { VideoQADetailPage } from './video-qa-detail-page';
import { VQAStatusBE, VQAItem, VQAStatus } from '../../models/video-qa/vqa.model';

/**
 * Generated class for the VideoQaChecklistPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'video-qa-checklist',
  templateUrl: 'video-qa-checklist.html',
})
export class VideoQaChecklistPage {

  checklist: VQAItem[];
  checklistFiltered: VQAItem[];
  title: any;
  equipmentType: any;
  filteringVQA: number = -1;
  woSID: number;
  woType: number;

  constructor(public navCtrl: NavController, public navParams: NavParams,
  private app: AppService) {
    this.checklist = navParams.get('checklist');
    this.title = navParams.get('title');
    this.equipmentType = navParams.get('equipmentType');
    this.woSID = navParams.get('woSID');
    this.woType = navParams.get('woType');
  }

  ionViewWillEnter(){
    this.checklistFiltered = JSON.parse(JSON.stringify(this.checklist)) as VQAItem[];
    this.reFilterGroups();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad VideoQaChecklistPage');
  }

  itemTapped(event, checkitem){
    this.app.navCtrl.push(VideoQADetailPage, {
      checkitem: this.checklist.filter(a => a.JobApplicableActionSID == checkitem.JobApplicableActionSID)[0],
      woSID: this.woSID,
      woType: this.woType
    });
  }

  filterGroups(index){
    this.checklistFiltered = JSON.parse(JSON.stringify(this.checklist)) as VQAItem[];
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
      console.log("Filtering...");
      this.matchFilter(this.filteringVQA);
    }
  }

  matchFilter(status){
    if (this.checklistFiltered){
      this.checklistFiltered = this.checklistFiltered.filter(item => {
        switch(status){
          case VQAStatus.Approved:
          return item.Status == VQAStatusBE.Approved;
          case VQAStatus.Rejected:
          return item.Status == VQAStatusBE.Rejected;
          case VQAStatus.Uploaded:
          return item.Status == VQAStatusBE.Uploaded;
          case VQAStatus.Pending:
          return item.Status == VQAStatusBE.Pending || !item.Status;
        }
      });
    }
  }

  getFilterIconName(index){
    if (index == this.filteringVQA){
      return "check-square-o";
    } else {
      return "square-o";
    }
  }

  getStatusClass(checkitem){
    switch(checkitem.Status){
      case VQAStatusBE.Approved:
      return "approved";
      case VQAStatusBE.Rejected:
      return "rejected";
      case VQAStatusBE.Uploaded:
      return "uploaded";
      case (VQAStatusBE.Pending || null):
      return "pending";
    }
  }

}
