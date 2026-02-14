import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelcase',
})
export class CamelcasePipe implements PipeTransform {


  transform(value?: string): string | undefined {
    if (value)
      return value.charAt(0).toUpperCase()+value.slice(1).toLowerCase();
    return value
  }
}
