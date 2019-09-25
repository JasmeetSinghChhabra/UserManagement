import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { DviListTabs } from './dvi-list-tabs';
import { DviList } from './dvi-list';
import { DviForm } from './dvi-form';
import { PipesModule } from '../../utils/pipes/pipes.module';
import { SelectSearchableModule } from '../../components/select-searchable/select-searchable.module';
import { SignatureModule } from '../../components/signature/signature.module';
import { CoreModule } from '../../app/core.module';

@NgModule({
  imports: [ CommonModule, IonicModule, PipesModule, SelectSearchableModule, SignatureModule, CoreModule ],
  declarations: [ DviListTabs, DviList, DviForm ],
  exports: [ DviListTabs, DviList, DviForm ],
  entryComponents: [ DviListTabs, DviList, DviForm ]
})
export class DviModule {
  constructor (@Optional() @SkipSelf() parentModule: DviModule) {
    if (parentModule) {
      throw new Error('DviModule is already loaded. Import it in the AppModule only');
    }
  }
}