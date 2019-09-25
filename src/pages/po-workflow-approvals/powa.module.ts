import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { PowerBIModule } from '../../components/power-bi/power-bi.module';
import { PowaHome } from './powa-home';
import { ApprovalSwitch } from './approval-switch';
import { PowaListTabs } from './powa-list-tabs';
import { PowaDetail } from './powa-detail';
import { CoreModule } from '../../app/core.module';
import { PipesModule } from '../../utils/pipes/pipes.module';

@NgModule({
  imports: [ CommonModule, IonicModule, CoreModule, PowerBIModule, PipesModule ],
  declarations: [ ApprovalSwitch, PowaHome, PowaListTabs, PowaDetail ],
  exports: [ ApprovalSwitch, PowaHome, PowaListTabs, PowaDetail ],
  entryComponents: [ ApprovalSwitch, PowaHome, PowaListTabs, PowaDetail ]
})
export class PowaModule {
  constructor (@Optional() @SkipSelf() parentModule: PowaModule) {
    if (parentModule) {
      throw new Error('PowaModule is already loaded. Import it in the AppModule only');
    }
  }
}