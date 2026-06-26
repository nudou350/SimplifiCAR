import { Pipe, PipeTransform } from '@angular/core';

function numberPt(n: number, dec: number): string {
  return (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// "62,59 ha" / "8,0 ha" — pt-BR with fixed decimals (default 1).
@Pipe({ name: 'ha', standalone: true })
export class HaPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 1, withUnit = true): string {
    const s = numberPt(value ?? 0, decimals);
    return withUnit ? `${s} ha` : s;
  }
}

// "R$ 38 mil" / "R$ 5,8 mil" — value in BRL rendered in thousands.
@Pipe({ name: 'mil', standalone: true })
export class MilPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const v = (value ?? 0) / 1000;
    const dec = Number.isInteger(v) ? 0 : 1;
    return `R$ ${numberPt(v, dec)} mil`;
  }
}

// Plain pt-BR distance: "1.900 km".
@Pipe({ name: 'km', standalone: true })
export class KmPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return `${(value ?? 0).toLocaleString('pt-BR')} km`;
  }
}
