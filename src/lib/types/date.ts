import { TZ_REGEX } from '$lib/regex';
import { isObject } from 'lodash-es';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatTimezone(timezone: string): string {
  if (timezone.startsWith('+') || timezone.startsWith('-')) {
    return 'GMT' + timezone;
  } else {
    return `GMT +${timezone}`;
  }
}

export class DateTime {
  year: number;
  /** January = 1, December = 12 */
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  timeZone?: string;

  constructor(
    year: number,
    month?: number,
    day?: number,
    hour?: number,
    minute?: number,
    timeZone?: string
  ) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.timeZone = timeZone;
  }

  toString(): string {
    let str = this.year.toString();

    if (this.month) {
      str += ', ' + MONTHS[this.month - 1];
    }
    if (this.day) {
      str += ' ' + this.day.toString();
    }

    if (this.hour) {
      if (this.hour < 10) {
        str += ', 0' + this.hour.toString();
      } else {
        str += ', ' + this.hour.toString();
      }
      if (this.minute) {
        if (this.minute < 10) {
          str += ':0' + this.minute.toString();
        } else {
          str += ':' + this.minute.toString();
        }
      } else {
        str += ':00';
      }
    }

    // This is too noisy IMO.
    // if (this.timeZone) {
    //   str += ', ' + formatTimezone(this.timeZone);
    // }

    return str;
  }

  static fromJSON(json: unknown): DateTime {
    if (!isProbablyTimelineDateTime(json)) {
      throw new Error(
        "The value passed to DateTime.fromJSON doesn't appear to be a valid TimelineDateTime"
      );
    }

    return new DateTime(json.year, json.month, json.day, json.hour, json.minute, json.timeZone);
  }

  toJSON(): string {
    return DateTime.toJSON(this);
  }

  static toJSON(dateTime: DateTime): string {
    return JSON.stringify(
      {
        year: dateTime.year,
        month: dateTime.month,
        day: dateTime.day,
        hour: dateTime.hour,
        minute: dateTime.minute,
        timeZone: dateTime.timeZone,
      },
      null,
      2
    );
  }

  toDate(): Date {
    return new Date(
      this.year,
      this.month ? this.month - 1 : 0,
      this.day ? this.day : 1,
      this.hour ? this.hour : 0,
      this.minute ? this.minute : 0
    );
  }
}

export function isProbablyTimelineDateTime(json: unknown): json is DateTime {
  return isObject(json) && 'year' in json && typeof json.year === 'number';
}

export function isPossibleToConstructValidDateTime(
  year: number,
  month?: number,
  day?: number,
  hour?: number,
  minute?: number,
  timeZone = ''
): boolean {
  return year >= 0 &&
    // month is optional, but if it's present, it must be between 1 and 12
    (!month || (month >= 1 && month <= 12)) &&
    // day is optional, but if it's present, it must be between 1 and 31
    (!day || (day >= 1 && day <= 31)) &&
    // hour is optional, but if it's present, it must be between 0 and 23
    (!hour || (hour >= 0 && hour <= 23)) &&
    // minute is optional, but if it's present, it must be between 0 and 59
    (!minute || (minute >= 0 && minute <= 59)) &&
    // timeZone is optional, but if it's present, it must be in the format +/-hh:mm
    timeZone
    ? TZ_REGEX.test(timeZone)
    : true;
}

export function tryToConstructDateTimeFromStrings(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  timeZone: string
): DateTime | undefined {
  const yearNumber = parseInt(year, 10);

  if (isNaN(yearNumber)) {
    return undefined;
  }

  // parseInt returns NaN if the string can't be parsed as a number
  let monthNumber: number | undefined = parseInt(month, 10);
  if (isNaN(monthNumber)) {
    monthNumber = undefined;
  }

  let dayNumber: number | undefined = parseInt(day, 10);
  if (isNaN(dayNumber)) {
    dayNumber = undefined;
  }

  let hourNumber: number | undefined = parseInt(hour, 10);
  if (isNaN(hourNumber)) {
    hourNumber = undefined;
  }

  let minuteNumber: number | undefined = parseInt(minute, 10);
  if (isNaN(minuteNumber)) {
    minuteNumber = undefined;
  }

  if (
    isPossibleToConstructValidDateTime(
      yearNumber,
      monthNumber,
      dayNumber,
      hourNumber,
      minuteNumber,
      timeZone
    )
  ) {
    return new DateTime(yearNumber, monthNumber, dayNumber, hourNumber, minuteNumber, timeZone);
  }
  return undefined;
}

export class DateTimeRange {
  start: DateTime;
  end?: DateTime;

  constructor(start: DateTime, end?: DateTime) {
    this.start = start;
    this.end = end;
  }

  static fromJSON(json: unknown): DateTimeRange {
    if (!isProbablyTimelineDateTimeRange(json)) {
      throw new Error(
        "The value passed to DateTimeRange.fromJSON doesn't appear to be a valid TimelineDateTimeRange"
      );
    }

    return new DateTimeRange(DateTime.fromJSON(json.start), DateTime.fromJSON(json.end));
  }

  toJSON(): string {
    return DateTimeRange.toJSON(this);
  }

  static toJSON(dateTimeRange: DateTimeRange): string {
    return JSON.stringify(
      {
        start: DateTime.toJSON(dateTimeRange.start),
        end: dateTimeRange.end ? DateTime.toJSON(dateTimeRange.end) : undefined,
      },
      null,
      2
    );
  }
}

export function isProbablyTimelineDateTimeRange(json: unknown): json is DateTimeRange {
  return isObject(json) && 'start' in json && typeof 'start' === 'object';
}
