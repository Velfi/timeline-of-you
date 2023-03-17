import { DateTime } from '$lib/types/date';
import { isProbablyADate } from '$lib/utils';
import { isObject } from 'lodash';
import * as dateFns from 'date-fns';

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

export function isProbablyEvent(json: unknown): json is Event {
  return (
    isObject(json) &&
    'start' in json &&
    'name' in json &&
    'tags' in json &&
    'createdOn' in json &&
    'lastModified' in json &&
    Array.isArray(json.tags)
  );
}

export function fromJSON(json: unknown): Event {
  if (!isProbablyEvent(json)) {
    throw new Error(
      "The value passed to Event.fromJSON doesn't appear to be a valid TimelineEvent"
    );
  }

  if (!isProbablyADate(json.createdOn)) {
    throw new Error('createdOn date is missing or invalid');
  }

  if (!isProbablyADate(json.lastModified)) {
    throw new Error('lastModified date is missing or invalid');
  }

  return {
    id: json.id,
    start: DateTime.fromJSON(json.start),
    end: json.end ? DateTime.fromJSON(json.end) : undefined,
    name: json.name,
    description: json.description,
    tags: json.tags,
    createdOn: dateFns.parseJSON(json.createdOn),
    lastModified: dateFns.parseJSON(json.lastModified),
  };
}

export function toJSON(event: Event): string {
  return JSON.stringify(
    {
      id: event.id,
      start: DateTime.toJSON(event.start),
      end: event.end ? DateTime.toJSON(event.end) : undefined,
      name: event.name,
      description: event.description,
      tags: event.tags,
      createdOn: dateFns.formatRFC7231(event.createdOn),
      lastModified: dateFns.formatRFC7231(event.lastModified),
    },
    null,
    2
  );
}
