import { NgModule, Optional, SkipSelf, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { SelectSearchableModule } from '../../components/select-searchable/select-searchable.module';
import { PipesModule } from '../../utils/pipes/pipes.module';
import { CoreModule } from '../../app/core.module';

import { IonicPageModule } from 'ionic-angular';
import { VideoQaSectorsPage } from './video-qa-sectors';
import { VideoQaChecklistPage } from './video-qa-checklist';
import { VideoQADetailPage } from './video-qa-detail-page';

@NgModule({
  imports: [CommonModule, IonicModule, SelectSearchableModule, PipesModule, CoreModule],
  declarations: [ VideoQaSectorsPage, VideoQaChecklistPage, VideoQADetailPage ],
  exports: [ VideoQaSectorsPage, VideoQaChecklistPage, VideoQADetailPage ],
  entryComponents: [ VideoQaSectorsPage, VideoQaChecklistPage, VideoQADetailPage ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VideoQaModule {
  constructor (@Optional() @SkipSelf() parentModule: VideoQaModule) {
    if (parentModule) {
      throw new Error('VideoQaModule is already loaded. Import it in the AppModule only');
    }
  }
}
