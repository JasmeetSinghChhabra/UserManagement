import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerBIComponent } from './power-bi';
import { service as PBIService, factories } from 'powerbi-client';

export * from './power-bi'

export function powerBiServiceFactory() {
  return new PBIService.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);
}

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PowerBIComponent
  ],
  providers: [
    { provide: 'PowerBIService', useFactory: powerBiServiceFactory } // To inject a instance of pbi client library
  ],
  exports: [
    PowerBIComponent
  ]
})
export class PowerBIModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PowerBIModule
    };
  }
}