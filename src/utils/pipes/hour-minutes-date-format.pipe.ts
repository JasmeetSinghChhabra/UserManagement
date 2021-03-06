﻿import { Constants } from '../../utils/utils';
import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hourMinutesDateTimeFormat'
})
export class HourMinutesDateTimeFormatPipe extends DatePipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return super.transform(value, Constants.DATE_HOUR);
  }
}