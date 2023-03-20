import { isObject } from 'lodash';
import { DateTime } from '$lib/types/date';
import * as dateFns from 'date-fns';

export interface Metadata {
  id?: number;
  version: number;

  eventIds: number[];

  name?: string;
  description?: string;
  start: DateTime;
  end: DateTime;

  createdOn: Date;
  lastModified: Date;
}

export function isProbablyMetadata(json: unknown): json is Metadata {
  return (
    isObject(json) &&
    'start' in json &&
    'end' in json &&
    'createdOn' in json &&
    'lastModified' in json
  );
}

export function fromJSON(json: unknown): Metadata {
  if (!isProbablyMetadata(json)) {
    throw new Error("The value passed to Metadata.fromJSON doesn't appear to be a valid Metadata");
  }

  return {
    // We don't want to keep the ID from the JSON because we can't use that ID in the database. If
    // we save a timeline with no ID, then we know it came from JSON and needs to be assigned an ID.
    // We must also assign IDs to all events and tags associated with it.
    version: json.version,

    eventIds: json.eventIds,

    name: json.name,
    description: json.description,
    start: DateTime.fromJSON(json.start),
    end: DateTime.fromJSON(json.end),

    createdOn: new Date(json.createdOn),
    lastModified: new Date(json.lastModified),
  };
}

export function toJSON(metadata: Metadata): string {
  return JSON.stringify(
    {
      id: metadata.id,

      name: metadata.name,
      description: metadata.description,
      start: metadata.start.toJSON(),
      end: metadata.end.toJSON(),

      createdOn: dateFns.formatRFC7231(metadata.createdOn),
      lastModified: dateFns.formatRFC7231(metadata.lastModified),
    },
    null,
    2
  );
}
