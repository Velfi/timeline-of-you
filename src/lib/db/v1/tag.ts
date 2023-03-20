import { isObject } from 'lodash-es';
import * as dateFns from 'date-fns';
import { isProbablyADate } from '$lib/utils';

export interface Tag {
  id?: number;
  name: string;
  description?: string;

  createdOn: Date;
  lastModified: Date;
}

export function isProbablyTag(json: unknown): json is Tag {
  return isObject(json) && 'name' in json && 'createdOn' in json && 'lastModified' in json;
}

export function fromJSON(json: unknown): Tag {
  if (!isProbablyTag(json)) {
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
    name: json.name,
    description: json.description,
    createdOn: dateFns.parseJSON(json.createdOn),
    lastModified: dateFns.parseJSON(json.lastModified),
  };
}

export function toJSON(tag: Tag): string {
  return JSON.stringify(
    {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      createdOn: dateFns.formatRFC7231(tag.createdOn),
      lastModified: dateFns.formatRFC7231(tag.lastModified),
    },
    null,
    2
  );
}

export const VALID_TAG_NAME_REGEX = /^[a-z0-9[\](){}\-_]+$/;
