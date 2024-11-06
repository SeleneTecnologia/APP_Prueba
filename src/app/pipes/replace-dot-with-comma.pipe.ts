import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceDotWithComma',
  standalone: true
})
export class ReplaceDotWithCommaPipe implements PipeTransform {

  transform(value: string | number): string {
    // Asegúrate de que el valor sea un string para aplicar el replace
    const stringValue = value.toString();
    return stringValue.replace(/\./g, ',');
  }
}