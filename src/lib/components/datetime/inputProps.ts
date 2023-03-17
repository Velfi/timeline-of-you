import { DAY_REGEX, HOUR_REGEX, MINUTE_REGEX, MONTH_REGEX, TZ_REGEX, YEAR_REGEX } from '$lib/regex';

function regexToInputPattern(regex: RegExp): string {
  return regex.source.replace(/\//g, '');
}

export const YEAR_INPUT_PROPS = {
  type: 'text',
  size: 4,
  pattern: regexToInputPattern(YEAR_REGEX),
  placeholder: 'YYYY',
  title: '1 to 4 digit year, B.C.E. years are unsupported',
};

const TWO_DIGIT_INPUT_PROPS = {
  type: 'text',
  maxlength: 2,
  size: 2,
};

export const MONTH_INPUT_PROPS = {
  ...TWO_DIGIT_INPUT_PROPS,
  pattern: regexToInputPattern(MONTH_REGEX),
  placeholder: 'MM',
  title: '1-2 digit month',
};
export const DAY_INPUT_PROPS = {
  ...TWO_DIGIT_INPUT_PROPS,
  pattern: regexToInputPattern(DAY_REGEX),
  placeholder: 'DD',
  title: '1-2 digit day',
};
export const HOUR_INPUT_PROPS = {
  ...TWO_DIGIT_INPUT_PROPS,
  placeholder: 'HH',
  pattern: regexToInputPattern(HOUR_REGEX),
  title: '1-2 digit hour',
};
export const MINUTE_INPUT_PROPS = {
  ...TWO_DIGIT_INPUT_PROPS,
  placeholder: 'MM',
  pattern: regexToInputPattern(MINUTE_REGEX),
  title: '1-2 digit minute',
};
export const TZ_INPUT_PROPS = {
  maxlength: 6,
  size: 7,
  type: 'text',
  pattern: regexToInputPattern(TZ_REGEX),
  class: 'four-digit',
  placeholder: '±HH:MM',
  title: 'GMT-relative time zone offset',
};
