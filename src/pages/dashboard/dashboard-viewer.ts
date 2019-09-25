import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, PopoverController, ViewController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DashboardService } from '../../services/services';
import { Helper } from '../../utils/utils';
import { PowerBIComponent, PowerBIModel, PowerBIType } from '../../components/power-bi/power-bi';
import { DashboardModel } from '../../models/models';
import * as pbi from 'powerbi-client';

@Component({
  selector: 'dashboard-viewer',
  templateUrl: 'dashboard-viewer.html',
  providers: [DashboardService]
})
export class DashboardViewer extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(PowerBIComponent) powerbiControl: PowerBIComponent;

  model: DashboardModel;
  powerBiModel: PowerBIModel;
  selectedPage: any;
  isLoading = false;
  pbiEmbed: any;
  tileAlreadyClicked: boolean;
  
  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private app: AppService, 
    private dashboardService: DashboardService, private helper: Helper, private popoverCtrl: PopoverController) {
    super(loadingCtrl);
    this.model = navParams.get('item');
    this.tileAlreadyClicked = false;
  }

  ngOnInit(): void {
      
  }

  private getIdFromEmbedUrl(embedUrl: string, type: PowerBIType): string {
    let id = "";
    if (type == PowerBIType.Dashboard) {
      id = this.helper.getParameterByName("dashboardId", embedUrl);
    } else if (type == PowerBIType.Report) {
      id = this.helper.getParameterByName("reportId", embedUrl);
    }
    return id;
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.tileAlreadyClicked = false;
    this.powerBiModel = new PowerBIModel();
    if(this.model.id) {
      this.dashboardService.getPowerBiData(this.model).subscribe(result => {
        let data = result.Data;
        let type = PowerBIModel.getType(this.model.type);
        let id = this.getIdFromEmbedUrl(data.embedUrl, type);
        let pbi = {
          type: type,
          accessToken: data.accessToken,
          embedUrl:  data.embedUrl,
          id: id,
          tokenType: 'Aad'
        } as PowerBIModel
        
        this.powerBiModel = pbi;        
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error has occurred fetching Power BI token");
      });
    } else {
      let type = PowerBIModel.getType(this.model.type);
      let pbi = {
        type: type,
        accessToken: this.model.accessToken,
        embedUrl: this.model.embedUrl,
        id: this.model.reportId,
        tokenType: 'Aad',
        pageName: this.model.pageName
      } as PowerBIModel
      
      this.powerBiModel = pbi;     
    }
  }

  ionViewWillLeave(){
  }

  private onEmbedded(pbiEmbed) {
    console.log("Power BI embedded!");
    console.log(pbiEmbed);
    if(pbiEmbed.embeType == "dashboard") {
      this.pbiEmbed = pbiEmbed;
      //Handle tile click event to open a new viewer
      this.pbiEmbed.on("tileClicked", data => {
        if (!this.tileAlreadyClicked){
          this.tileAlreadyClicked = true;
          let tile = data.detail;
          console.log(tile);
          let item = new DashboardModel();
          item.embedUrl = tile.reportEmbedUrl;
          item.type = "report";
          item.reportId = this.getIdFromEmbedUrl(tile.reportEmbedUrl, PowerBIType.Report);
          item.text = "Report [" + tile.pageName + "]";
          item.pageName = tile.pageName;
          item.accessToken = pbiEmbed.config.accessToken;
          this.app.navCtrl.push(DashboardViewer, {
            item: item
          });
        }
      })
    }
  }

  private onLoaded(pbiEmbed) {
    this.isLoading = false;
    console.log("Power BI loaded!");
    if(pbiEmbed.embeType == "report") {
      pbiEmbed.getPages().then(pages => {
        console.log(pages);
        this.model.pages = pages;
        if(pages.length > 0){
          this.selectedPage = pages.find(function(page) {
            return page.isActive == true;
          });
          this.model.subtitle = this.selectedPage.displayName != null ? this.selectedPage.displayName : "";
        }
      });
    }
  }

  private presentPopover(event) {
    let popover = this.popoverCtrl.create(DashboardMenu, { pages: this.model.pages });
    popover.present();
    popover.onDidDismiss(page => {
      if(page) {
        console.log("Selected page: " + page.displayName);
        this.model.subtitle = page.displayName;
        page.setActive();
      }
    });
  }

  private showPopoverButton() {
    if(this.model.pages && this.model.pages.length > 0){
      return true;
    }
    return false;
  }
}

@Component({
  template: `
    <ion-list>
      <ion-list-header>Pages</ion-list-header>
      <button ion-item *ngFor="let page of pages" (click)="pageSelected($event, page)">{{page.displayName}}</button>
    </ion-list>
  `
})
export class DashboardMenu {

  pages: any[];

  constructor(public viewCtrl: ViewController, public navParams: NavParams) {
    this.pages = this.navParams.get('pages');
  }

  pageSelected(event, page) {
    this.viewCtrl.dismiss(page);
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
