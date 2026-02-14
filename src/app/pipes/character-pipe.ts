import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'character',
})
export class CharacterPipe implements PipeTransform {

  transform(value?: string): string | undefined {
    if (value)
      return value.charAt(0).toUpperCase() + value.charAt(1).toUpperCase() + '?' ;
    return value
  }

}
