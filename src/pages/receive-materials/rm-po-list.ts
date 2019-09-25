import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar, AlertController } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, ReceiveMaterialsService, GeoService, AuthService } from '../../services/services';
import { POHeader } from '../../models/models';
import { RMPODetail } from './rm-po-detail';

@Component({
  selector: 'rm-po-list',
  templateUrl: 'rm-po-list.html',
  providers: [ReceiveMaterialsService]
})

export class RMPOList extends BasePage {
  @ViewChild(Content) content: Content;

  searchText: string = '';
  searchCallout: string = '';
  POHeaders: POHeader[];
  page: string;
  parentPage: any;

  constructor(
    public loadingCtrl: LoadingController,
    private navParams: NavParams,
    private receiveMaterialsService: ReceiveMaterialsService,
    private app: AppService,
    private alertCtrl: AlertController,
    private auth: AuthService) {
    super(loadingCtrl);
    this.page = "list";
    this.searchText = navParams.get('searchText');
    this.searchCallout = navParams.get('searchCallout');
    this.parentPage = navParams.get('parentPage');
    this.POHeaders = navParams.get('POHeaders');

  }

  ngOnInit(): void {
  }

  itemTapped(event, item) {
    this.app.navCtrl.push(RMPODetail, {
      item: item,
      "parentPage": this
    });
  }

  cancel(): void {
    this.app.navCtrl.pop();
  }

}
