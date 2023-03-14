import Dexie, { type Table } from 'dexie';
import type { DateTime } from './types/date';

export interface Timeline {
  id?: string;

  createdOn: Date;
  lastModified: Date;

  name?: string;
  description?: string;
  start: DateTime;
  end: DateTime;
  // Event IDs
  events: string[];
}

export interface Event {
  id?: string;

  createdOn: Date;
  lastModified: Date;

  name: string;
  description?: string;
  start: DateTime;
  end?: DateTime;
  // Tag IDs
  tags: string[];
}

export interface Tag {
  id?: string;

  createdOn: Date;
  lastModified: Date;

  name: string;
  description?: string;
}

export class TimelineDexie extends Dexie {
  // These tables are added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  timelines!: Table<Timeline>;
  events!: Table<Event>;
  tags!: Table<Tag>;

  constructor() {
    super('timelineDatabase');
    // v1 2023-03-11 - initial version
    this.version(1).stores({
      timelines: '++id, name, start, end',
      events: '++id, name, start, end, *tags',
      tags: '++id, &name',
    });
  }
}

export const db = new TimelineDexie();
