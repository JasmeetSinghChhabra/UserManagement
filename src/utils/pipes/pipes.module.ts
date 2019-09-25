import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListDateTimeFormatPipe } from './list-date-format.pipe';
import { FullDateTimeFormatPipe } from './full-date-format.pipe';
import { HourMinutesDateTimeFormatPipe } from './hour-minutes-date-format.pipe';
import { ReversePipe } from './array-reverse.pipe';
import { OrderByPipe } from './order-by.pipe';

@NgModule({
  declarations: [ListDateTimeFormatPipe, FullDateTimeFormatPipe, HourMinutesDateTimeFormatPipe, ReversePipe, OrderByPipe],
  imports: [CommonModule],
  exports: [ListDateTimeFormatPipe, FullDateTimeFormatPipe, HourMinutesDateTimeFormatPipe, ReversePipe, OrderByPipe]
})
export class PipesModule { }