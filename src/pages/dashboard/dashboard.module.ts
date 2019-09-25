import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { PowerBIModule } from '../../components/power-bi/power-bi.module';
import { DashboardViewer, DashboardMenu } from './dashboard-viewer';
import { DashboardHome } from './dashboard-home';
import { CoreModule } from '../../app/core.module';

@NgModule({
  imports: [ CommonModule, IonicModule, CoreModule, PowerBIModule ],
  declarations: [ DashboardHome, DashboardViewer, DashboardMenu ],
  exports: [ DashboardHome, DashboardViewer, DashboardMenu ],
  entryComponents: [ DashboardHome, DashboardViewer, DashboardMenu ]
})
export class DashboardModule {
  constructor (@Optional() @SkipSelf() parentModule: DashboardModule) {
    if (parentModule) {
      throw new Error('DashboardModule is already loaded. Import it in the AppModule only');
    }
  }
}