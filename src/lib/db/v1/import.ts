import {
  type Metadata,
  type Event,
  type Tag,
  MetadataFromJSON,
  EventFromJSON,
  TagFromJSON,
  type V1Timeline,
} from './';
import { isObject } from 'lodash-es';

export function importV1Timeline(obj: object): V1Timeline {
  if (!('metadata' in obj && isObject(obj.metadata))) {
    throw new Error('metadata object is missing or invalid');
  }
  if (!('events' in obj && Array.isArray(obj.events))) {
    throw new Error('events array is missing or invalid');
  }
  if (!('tags' in obj && Array.isArray(obj.tags))) {
    throw new Error('tags array is missing or invalid');
  }

  const version = 1;
  const metadata = parseV1Metadata(obj.metadata);
  const events = parseV1Events(obj.events);
  const tags = parseV1Tags(obj.tags);

  return { version, metadata, events, tags };
}

function parseV1Metadata(obj: unknown): Metadata {
  return MetadataFromJSON(obj);
}

function parseV1Events(arr: unknown[]): Event[] {
  if (!Array.isArray(arr)) {
    throw new Error('events array is missing or invalid');
  }

  const events: Event[] = [];

  for (const obj of arr) {
    const e = EventFromJSON(obj);
    events.push(e);
  }

  return events;
}

function parseV1Tags(arr: unknown[]): Tag[] {
  if (!Array.isArray(arr)) {
    throw new Error('tags array is missing or invalid');
  }

  const events: Tag[] = [];

  for (const obj of arr) {
    const e = TagFromJSON(obj);
    events.push(e);
  }

  return events;
}
