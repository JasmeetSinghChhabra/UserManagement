import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DfrService } from '../../services/services';
import { DfrModel, DfrStatus } from '../../models/models';
import { DfrForm } from './dfr-form';
import { DfrSummary } from './dfr-summary';

//@IonicPage()
@Component({
  selector: 'dfr-list',
  templateUrl: 'dfr-list.html',
  providers: [DfrService]
})
export class DfrList extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(Searchbar) searchbar: Searchbar;
  private tabBarHeight;
  private topOrBottom: string;
  private contentBox;
  selectedItem: any;
  dfrs: DfrModel[];
  dfrsOriginal: DfrModel[];
  status: number = 2;
  skip: number = 0;
  top: number = 10;
  toggled: boolean = false;
  searchTerm: string = '';

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private dfrService: DfrService, private app: AppService) {
    super(loadingCtrl);    
    this.status = navParams.data.status;
  }

  ngOnInit(): void {
    this.getDfrs(this.status);
  }

  getDfrs(status: number): void {
    this.presentLoading();
    this.dfrService.getDfrs(this.status, this.top, this.skip).subscribe(
      data => {
        //console.log(data);
        this.dfrs = data as DfrModel[];
        this.dfrsOriginal = data as DfrModel[];
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("Oops! An error has occurred fetching DFRs");
      }
    );
  }

  newDfr() {
    this.app.navCtrl.push(DfrForm);
  }

  itemTapped(event, item) {
    //Navigate to the DFR form page
    if (this.status == DfrStatus.Submitted) {
      this.app.navCtrl.push(DfrSummary, {
          item: item
        });
    } else {
      this.app.navCtrl.push(DfrForm, {
        item: item
      });
    }
  }

  toggleSearch() {
    this.toggled = !this.toggled;
    setTimeout(() => {
      if (this.searchbar) this.searchbar.setFocus();
    });
  }

  search(event) {
      // set val to the value of the searchbar
      let val = event.target.value;
      // if the value is an empty string don't filter the items
      if (val && val.trim() != '') {
        console.log(val.toLowerCase());
        this.dfrs = this.dfrsOriginal.filter((item) => {
          var custom = item.ReportDate.substring(5, 7) + item.ReportDate.substring(8, 10) + item.ReportDate.substring(0, 4);
          return (item.Site.SiteName.toLowerCase().indexOf(val.toLowerCase()) > -1 || item.Site.SiteNumber.toLowerCase().indexOf(val.toLowerCase()) > -1 || item.ReportId.toString().indexOf(val) > -1 || custom.lastIndexOf(val, 0) === 0);
        });
      } else {
        this.dfrs = this.dfrsOriginal.slice();
      }
  }

  doRefresh(refresher) {
    this.skip = 0;
    console.log(`Refresher scrolling... Top:${this.top} Skip:${this.skip}`);
    this.dfrService.getDfrs(this.status, this.top, this.skip).subscribe(
      data => {
        this.dfrs = data as DfrModel[];
        this.dfrsOriginal = data as DfrModel[];
        refresher.complete();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error has occurred fetching DFRs");
      }
    );
  }

  doPulling(refresher) {
    //console.log('Do Pulling...', refresher.progress);
  }

  doInfinite(infiniteScroll) {
    this.skip += 10;
    console.log(`Infinite scrolling... Top:${this.top} Skip:${this.skip}`);
    this.dfrService.getDfrs(this.status, this.top, this.skip).subscribe(
      data => {
        let newDfrs = data as DfrModel[];
        this.dfrs = this.dfrs.slice();
        this.dfrsOriginal = this.dfrsOriginal.slice();
        for (let i = 0; i < newDfrs.length; i++) {
          this.dfrs.push(newDfrs[i]);
          this.dfrsOriginal.push(newDfrs[i]);
        }
        infiniteScroll.complete();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error has occurred fetching DFRs");
      }
    );
  }

}
