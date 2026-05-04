import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abbreviateNumber',
  standalone: true
})
export class AbbreviateNumberPipe implements PipeTransform {
  transform(value: number | string): string {
    if (value === null || value === undefined) return '0';
    
    const num = Number(value);
    if (isNaN(num)) return value.toString();

    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
      { value: 1e12, symbol: "T" }
    ];

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup.slice().reverse().find(function(item) {
      return num >= item.value;
    });

    return item 
      ? (num / item.value).toFixed(1).replace(rx, "$1") + item.symbol 
      : "0";
  }
}