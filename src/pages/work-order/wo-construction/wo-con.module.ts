import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { CoreModule } from '../../../app/core.module';
import { WorkOrderCONListTabs } from './wo-con-list-tabs';
import { WorkOrderCONList } from './wo-con-list';
import { WorkOrderCONForm } from './wo-con-form';
import { PipesModule } from '../../../utils/pipes/pipes.module';
import { DocumentLibraryModule } from '../../../components/document-library/document-library.module';
import { CheckInModule } from './components/checkin.module';

@NgModule({
  imports: [ CoreModule, CommonModule, IonicModule, PipesModule, DocumentLibraryModule, CheckInModule ],
  declarations: [ WorkOrderCONListTabs, WorkOrderCONList, WorkOrderCONForm ],
  exports: [ WorkOrderCONListTabs, WorkOrderCONList, WorkOrderCONForm ],
  entryComponents: [ WorkOrderCONListTabs, WorkOrderCONList, WorkOrderCONForm ]
})
export class WorkOrderCONModule {
  constructor (@Optional() @SkipSelf() parentModule: WorkOrderCONModule) {
    if (parentModule) {
      throw new Error('WorkOrderCONModule is already loaded. Import it in the AppModule only');
    }
  }
}