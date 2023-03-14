import { isObject } from 'lodash';
// import { differenceInDays } from 'date-fns';
import { Event } from './types/event';
import { DateTime } from './types/date';
import { nanoid } from 'nanoid';

export class State {
  createdOn?: Date;
  description?: string;
  end: DateTime;
  events: Event[] = [];
  id: string;
  lastModified?: Date;
  name?: string;
  start: DateTime;

  constructor(start: DateTime, end: DateTime, id?: string) {
    this.id = id ?? nanoid();
    this.start = start;
    this.end = end;
  }

  get lengthInDays(): number {
    // TODO
    return 0;
    // return differenceInDays(this.start, this.end);
  }

  static fromJSON(json: unknown): State {
    if (!isProbablyTimelineState(json)) {
      throw new Error(
        "The value passed to State.fromJSON doesn't appear to be a valid TimelineState"
      );
    }

    const s = new State(DateTime.fromJSON(json.start), DateTime.fromJSON(json.end), json.id);
    s.events = json.events.map((e) => Event.fromJSON(e));
    s.createdOn = json.createdOn ? new Date(json.createdOn) : undefined;
    s.lastModified = json.lastModified ? new Date(json.lastModified) : undefined;
    s.description = json.description;
    s.name = json.name;

    return s;
  }

  toJSON(): string {
    return State.toJSON(this);
  }

  static toJSON(state: State): string {
    return JSON.stringify(
      {
        createdOn: state.createdOn,
        end: state.end.toJSON(),
        events: state.events.map((e) => Event.toJSON(e)),
        id: state.id,
        lastModified: state.lastModified,
        note: state.description,
        start: state.start.toJSON(),
        title: state.name,
      },
      null,
      2
    );
  }
}

export function isProbablyTimelineState(json: unknown): json is State {
  return (
    isObject(json) &&
    'id' in json &&
    'start' in json &&
    'end' in json &&
    'events' in json &&
    Array.isArray(json.events)
  );
}
