import { BasePage } from '../base.page';
import { LoadingController, NavParams } from "ionic-angular";
import { WCIStart } from './wci-start'
import { AppService, WarehouseCheckInService } from '../../services/services';
import { Component } from '@angular/core';

@Component({
    selector: 'wci-thank-you',
    templateUrl: 'wci-thank-you.html',
    providers: [WarehouseCheckInService]
})

export class WCIThankYou extends BasePage {

    workOrderSid: number;
    stagedLocation: string;

    constructor(loadingCtrl: LoadingController,
        private navParams: NavParams,
        private warehouseCheckInService : WarehouseCheckInService,
        private app: AppService) {
        super(loadingCtrl);
        this.workOrderSid = this.navParams.get('wosid');
        this.stagedLocation = "";
    }
    
    ngOnInit(): void {
        this.warehouseCheckInService.getWarehouseLane(this.workOrderSid).then(
            response => {
                this.stagedLocation = response.StagedLocation;
            }
        )
        //start timer here. if timer expires, close the alert and redirect to Start page.        
        setTimeout(() => {
            this.app.navCtrl.push(WCIStart);
        }, 60000)
    }

    confirmThankYou(){
        this.app.navCtrl.push(WCIStart);
    }

    getStagedLocation(){
        return this.stagedLocation;
    }
}