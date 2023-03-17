import { isDate, isNumber, isString, isFinite } from 'lodash';

export function downloadJSONFile(data: unknown, filename: string, pretty = true) {
  const blob = new Blob([JSON.stringify(data, null, pretty ? 2 : undefined)], {
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
