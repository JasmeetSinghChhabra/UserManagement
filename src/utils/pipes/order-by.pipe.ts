import { Pipe } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'orderBy'
})

export class OrderByPipe {
  transform(array, arg1, arg2) {
    if(!array) {return null;}
    if(arg2=='date'){
      array.sort((a: any, b: any) => {
        let ae = a[arg1];
        let be = b[arg1];
        ae = new Date(ae).setHours(0,0,0,0);
        be = new Date(be).setHours(0,0,0,0);
        return ae > be ? 1 : -1;
      });
      return array;
    }
    return _.sortBy(array, arg1);
  }
}