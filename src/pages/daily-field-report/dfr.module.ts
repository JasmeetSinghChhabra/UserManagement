import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { DfrListTabs } from './dfr-list-tabs';
import { DfrList } from './dfr-list';
import { DfrForm } from './dfr-form';
import { DfrSummary } from './dfr-summary';
import { DfrApproveReject } from './dfr-approve-reject';
import { PipesModule } from '../../utils/pipes/pipes.module';
import { AudioNoteModule } from '../../components/audio-note/audio-note.module';
import { SpeechToTextModule } from '../../components/speech-to-text/speech-to-text.module';
import { SelectSearchableModule } from '../../components/select-searchable/select-searchable.module';
import { SignatureModule } from '../../components/signature/signature.module';
import { CoreModule } from '../../app/core.module';

@NgModule({
  imports: [ CommonModule, IonicModule, PipesModule, AudioNoteModule, SpeechToTextModule, SelectSearchableModule, SignatureModule, CoreModule ],
  declarations: [ DfrListTabs, DfrList, DfrForm, DfrSummary, DfrApproveReject ],
  exports: [ DfrListTabs, DfrList, DfrForm, DfrSummary ],
  entryComponents: [ DfrListTabs, DfrList, DfrForm, DfrSummary, DfrApproveReject ]
})
export class DfrModule {
  constructor (@Optional() @SkipSelf() parentModule: DfrModule) {
    if (parentModule) {
      throw new Error('DfrModule is already loaded. Import it in the AppModule only');
    }
  }
}