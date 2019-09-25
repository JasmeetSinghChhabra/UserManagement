import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams, LoadingController, Content, Searchbar } from 'ionic-angular';
import { BasePage } from '../base.page';
import { AppService, DviService } from '../../services/services';
import { DviModel, DviStatus } from '../../models/models';
import { DviForm } from './dvi-form';

//@IonicPage()
@Component({
  selector: 'dvi-list',
  templateUrl: 'dvi-list.html',
  providers: [DviService]
})
export class DviList extends BasePage {
  @ViewChild(Content) content: Content;
  @ViewChild(Searchbar) searchbar: Searchbar;
  private tabBarHeight;
  private topOrBottom: string;
  private contentBox;

  selectedItem: any;
  dvis: DviModel[];
  dvisOriginal: DviModel[];
  status: number = 2;
  skip: number = 0;
  top: number = 10;
  toggled: boolean = false;
  searchTerm: string = '';

  constructor(loadingCtrl: LoadingController, private navParams: NavParams, private dviService: DviService, private app: AppService) {
    super(loadingCtrl);    
    this.status = navParams.data.status;
  }

  ngOnInit(): void {
    this.getDvis(this.status);
  }

  getDvis(status: number): void {
    this.presentLoading();
    this.dviService.getDvis(this.status, this.top, this.skip).subscribe(
      data => {
        //console.log(data);
        this.dvis = data as DviModel[];
        this.dvisOriginal = data as DviModel[];
        this.dismissLoading();
      },
      error => {
        console.error(error);
        this.dismissLoading();
        this.app.showErrorToast("Oops! An error has occurred fetching DVIs");
      }
    );
  }

  newDvi() {
    this.app.navCtrl.push(DviForm);
  }

  itemTapped(event, item) {
    //Navigate to the DVI form page
    this.app.navCtrl.push(DviForm, {
      item: item
    });
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
        this.dvis = this.dvisOriginal.filter((item) => {
          var custom = item.InspectionDate.substring(5, 7) + item.InspectionDate.substring(8, 10) + item.InspectionDate.substring(0, 4);
          if (custom.lastIndexOf(val, 0) === 0) {
            return true;
          } else {
            return false;
          }
        });
      } else {
        this.dvis = this.dvisOriginal.slice();
      }
  }

  doRefresh(refresher) {
    this.skip = 0;
    console.log(`Refresher scrolling... Top:${this.top} Skip:${this.skip}`);
    this.dviService.getDvis(this.status, this.top, this.skip).subscribe(
      data => {
        this.dvis = data as DviModel[];
        this.dvisOriginal = data as DviModel[];
        refresher.complete();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error has occurred fetching DVIs");
      }
    );
  }

  doPulling(refresher) {
    //console.log('Do Pulling...', refresher.progress);
  }

  doInfinite(infiniteScroll) {
    this.skip += 10;
    console.log(`Infinite scrolling... Top:${this.top} Skip:${this.skip}`);
    this.dviService.getDvis(this.status, this.top, this.skip).subscribe(
      data => {
        let newDvis = data as DviModel[];
        this.dvis = this.dvis.slice();
        this.dvisOriginal = this.dvisOriginal.slice();
        for (let i = 0; i < newDvis.length; i++) {
          this.dvis.push(newDvis[i]);
          this.dvisOriginal.push(newDvis[i]);
        }
        infiniteScroll.complete();
      },
      error => {
        console.error(error);
        this.app.showErrorToast("Oops! An error has occurred fetching DVIs");
      }
    );
  }

}
