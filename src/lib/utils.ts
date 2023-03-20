import { isDate, isNumber, isString, isFinite } from 'lodash';

export function downloadJSONFile(data: string, filename: string) {
  const blob = new Blob([data], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
}

export function isProbablyADate(it: unknown): it is string | Date | number {
  return isString(it) || isDate(it) || (isNumber(it) && isFinite(it));
}
