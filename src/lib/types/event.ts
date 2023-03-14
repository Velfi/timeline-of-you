import { isObject } from 'lodash';
import { nanoid } from 'nanoid';
import { DateTime } from './date';

export class Event {
  readonly id: string;
  readonly start: DateTime;
  readonly end?: DateTime;
  readonly title: string;
  readonly note?: string;
  readonly tags: Array<string>;

  constructor(event: {
    id?: string;
    start: DateTime;
    end?: DateTime;
    title: string;
    note?: string;
    tags: Array<string>;
  }) {
    this.id = event.id ? event.id : nanoid();
    this.start = event.start;
    this.end = event.end;
    this.title = event.title;
    this.note = event.note;
    this.tags = event.tags;
  }

  static fromJSON(json: unknown): Event {
    if (!isProbablyTimelineEvent(json)) {
      throw new Error(
        "The value passed to Event.fromJSON doesn't appear to be a valid TimelineEvent"
      );
    }

    return new Event({
      id: json.id,
      start: DateTime.fromJSON(json.start),
      end: json.end ? DateTime.fromJSON(json.end) : undefined,
      title: json.title,
      note: json.note,
      tags: json.tags,
    });
  }

  toJSON(): string {
    return Event.toJSON(this);
  }

  static toJSON(event: Event): string {
    return JSON.stringify(
      {
        id: event.id,
        start: DateTime.toJSON(event.start),
        end: event.end ? DateTime.toJSON(event.end) : undefined,
        title: event.title,
        note: event.note,
        tags: event.tags,
      },
      null,
      2
    );
  }
}

export function isProbablyTimelineEvent(json: unknown): json is Event {
  return (
    isObject(json) &&
    'id' in json &&
    'start' in json &&
    'title' in json &&
    'tags' in json &&
    Array.isArray(json.tags)
  );
}
