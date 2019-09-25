import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular'
import { PipesModule } from '../../utils/pipes/pipes.module';
import { SelectSearchableModule } from '../../components/select-searchable/select-searchable.module';
import { SignatureModule } from '../../components/signature/signature.module';
import { CoreModule } from '../../app/core.module';
import { RMSiteSearch } from './rm-search';
import { RMSiteSearchMaterial } from '../receive-materials/rm-materialsearch';
import { RMPOList } from './rm-po-list';
//import { RMaterialPOList } from './rm-pomaterial-list';
import { RMPODetail } from './rm-po-detail';
import { MaterialsScannerModule } from './components/materials-scanner.module';
import { RMPOMaterialDetail } from './rm-pomaterial-detail';
import { NexiusMaterialsScanner } from './components/nexiusmaterials-scanner';

@NgModule({
  imports: [ CommonModule, IonicModule, PipesModule, SelectSearchableModule, SignatureModule, CoreModule, MaterialsScannerModule ],
  declarations: [ RMSiteSearch, RMSiteSearchMaterial, RMPOList, RMPODetail , RMPOMaterialDetail  ],
  exports: [ RMSiteSearch, RMSiteSearchMaterial, RMPOList, RMPODetail ],
  entryComponents: [ RMSiteSearch, RMSiteSearchMaterial, RMPOList, RMPODetail  , RMPOMaterialDetail , NexiusMaterialsScanner ]
})
export class ReceiveMaterialsModule {
  constructor (@Optional() @SkipSelf() parentModule: ReceiveMaterialsModule) {
    if (parentModule) {
      throw new Error('ReceiveMaterialsModule is already loaded. Import it in the AppModule only');
    }
  }
}