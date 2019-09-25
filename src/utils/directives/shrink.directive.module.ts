import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShrinkDirective } from './shrink.directive';

export * from './shrink.directive';

@NgModule({
  declarations: [ShrinkDirective],
  imports: [CommonModule],
  exports: [ShrinkDirective]
})
export class ShrinkDirectiveModule { }