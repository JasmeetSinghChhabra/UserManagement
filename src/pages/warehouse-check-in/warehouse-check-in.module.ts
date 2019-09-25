import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { PipesModule } from '../../utils/pipes/pipes.module';
import { SelectSearchableModule } from '../../components/select-searchable/select-searchable.module';
import { SignatureModule } from '../../components/signature/signature.module';
import { CoreModule } from '../../app/core.module';
import { WCIStart } from './wci-start';
import { WCISiteSearch } from './wci-site-search';
import { WCICheckInDetails } from './wci-check-in-details';
import { WCIThankYou } from './wci-thank-you';

@NgModule({
  imports: [ CommonModule, IonicModule, PipesModule, SelectSearchableModule, SignatureModule, CoreModule ],
  declarations: [ WCIStart, WCISiteSearch, WCICheckInDetails, WCIThankYou ],
  exports: [ WCIStart, WCISiteSearch, WCICheckInDetails, WCIThankYou ],
  entryComponents: [ WCIStart, WCISiteSearch, WCICheckInDetails, WCIThankYou ]
})
export class WarehouseCheckInModule {
  constructor (@Optional() @SkipSelf() parentModule: WarehouseCheckInModule) {
    if (parentModule) {
      throw new Error('WarehouseCheckInModule is already loaded. Import it in the AppModule only');
    }
  }
}