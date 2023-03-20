import type { DateTime } from '$lib/types/date';
import Dexie, { type Table } from 'dexie';
import { exportJSON } from './export';
import { importJSON } from './import';
import type { Metadata, Tag, Event } from './v1';

export const SCHEMA_VERSION = 1;

export class TimelineDexie extends Dexie {
  // These tables are added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  metadata!: Table<Metadata>;
  events!: Table<Event>;
  tags!: Table<Tag>;

  constructor() {
    super('timelineDB');
    this.version(SCHEMA_VERSION).stores({
      timelines: '++id, version, &metadataId, *eventIds',
      metadata: '++id, name, description, start, end, createdOn, lastModified',
      events: '++id, name, description, start, end, *tagIds, createdOn, lastModified',
      tags: '++id, &name, description, createdOn, lastModified',
    });
  }
}

const db = new TimelineDexie();

export async function getTimelineById(id: number): Promise<Timeline> {
  console.log(`Getting timeline with ID ${id}...`);
  const metadata = await db.metadata.get(id);

  if (!metadata) {
    throw new Error(`No timeline with ID ${id} found.`);
  }
  const { eventIds, ...rest } = metadata;

  const events = (await db.events.bulkGet(eventIds)).filter((e): e is Event => e !== undefined);
  // TODO report IDs of events that weren't found
  console.assert(events.length === eventIds.length, 'Some events were not found!');

  const tagIDs = events.flatMap((event) => event.tagIds);
  const tags = (await db.tags.bulkGet(tagIDs)).filter((t): t is Tag => t !== undefined);
  // TODO report IDs of tags that weren't found
  console.assert(tags.length === tagIDs.length, 'Some tags were not found!');

  const timeline: Timeline = {
    ...rest,
    events,
  };

  console.log('Timeline retrieved.');
  return timeline;
}

export async function getTimelineMetadataList(): Promise<TimelineMetadata[]> {
  console.log('Getting timeline metadata list...');
  const metadataList = (await db.metadata.toArray()).map(
    ({ id, name, description, start, end }) => ({ id, name, description, start, end })
  );
  console.log('Timeline metadata list retrieved.');

  return metadataList;
}

export async function deleteTimelineById(id: number) {
  console.log(`Deleting timeline with ID ${id}...`);
  const metadata = await db.metadata.get(id);

  if (!metadata) {
    throw new Error(`No timeline with ID ${id} found.`);
  }

  const eventIds = metadata.eventIds;
  const events = (await db.events.bulkGet(eventIds)).filter((e): e is Event => e !== undefined);
  // TODO report IDs of events that weren't found
  console.assert(events.length === eventIds.length, 'Some events were not found!');

  const tagIDs = events.flatMap((event) => event.tagIds);
  const tags = (await db.tags.bulkGet(tagIDs)).filter((t): t is Tag => t !== undefined);
  // TODO report IDs of tags that weren't found
  console.assert(tags.length === tagIDs.length, 'Some tags were not found!');

  db.metadata.delete(id);
  db.events.bulkDelete(eventIds);
  db.tags.bulkDelete(tagIDs);
  console.log('Timeline deleted.');
}

export async function createTimeline(
  start: DateTime,
  end: DateTime,
  name?: string,
  description?: string
): Promise<Timeline> {
  console.log('Creating timeline...');
  const createdOn = new Date();
  const lastModified = new Date();
  const metadata: Metadata = {
    version: SCHEMA_VERSION,
    name,
    description,
    start,
    end,
    eventIds: [],
    createdOn,
    lastModified,
  };

  const metadataId = await db.metadata.add(metadata);

  if (metadataId === undefined || typeof metadataId !== 'number' || isNaN(metadataId)) {
    throw new Error('Failed to create timeline.');
  }

  const timeline: Timeline = {
    id: metadataId,
    name,
    description,
    start,
    end,
    version: SCHEMA_VERSION,
    events: [],
    createdOn,
    lastModified,
  };

  console.log('Timeline created.');
  return timeline;
}

export async function addEventToTimelineWithId(
  event: TimelineEvent,
  timelineID: number
): Promise<void> {
  console.log(`Adding event to timeline with ID ${timelineID}...`);
  const metadata = await db.metadata.get(timelineID);

  if (!metadata) {
    throw new Error(`No timeline with ID ${timelineID} found.`);
  }

  const eventID = await db.events.add({
    ...event,
    createdOn: new Date(),
    lastModified: new Date(),
  });

  if (eventID === undefined || typeof eventID !== 'number' || isNaN(eventID)) {
    throw new Error('Failed to add event to timeline.');
  }

  metadata.eventIds.push(eventID);
  metadata.lastModified = new Date();
  await db.metadata.update(timelineID, metadata);

  console.log('Event added to timeline.');
}

export async function addTag(tag: { name: string; description?: string }): Promise<number> {
  console.log(`Adding tag...`);
  const tagId = await db.tags.add({
    ...tag,
    createdOn: new Date(),
    lastModified: new Date(),
  });

  if (tagId === undefined || typeof tagId !== 'number' || isNaN(tagId)) {
    throw new Error('Failed to add tag.');
  }

  console.log('Tag added.');
  return tagId;
}

export async function addTags(tagNames: string[]): Promise<number[]> {
  const tagIds = [];
  for (const name of tagNames) {
    const tagId = await db.tags.add({
      name,
      createdOn: new Date(),
      lastModified: new Date(),
    });

    tagIds.push(tagId as number);
  }

  return tagIds;
}

export async function saveTimelineToDb(timeline: Timeline): Promise<void> {
  console.log(`Saving timeline with ID ${timeline.id} to database...`);

  if (timeline.id) {
    const { id, events, ...rest } = timeline;
    const eventIds = events.map((e) => e.id).filter((e): e is number => e !== undefined);
    await db.metadata.update(id, { ...rest, eventIds });

    // Tags should already have been saved so we don't need to re-save them.
    db.events.bulkPut(events);
  } else {
    throw new Error('TODO: enable saving timelines with no ID');
  }

  console.log('Timeline saved to database.');
}

export async function importTimelineFromJSON(json: string): Promise<Timeline> {
  const timelineId = await importJSON(json);
  return getTimelineById(timelineId);
}

export function exportTimelineToJSON(id: number): Promise<string> {
  return exportJSON(id, db);
}

export async function importTags(tags: Tag[]): Promise<Map<number, number>> {
  const tagIdMap = new Map<number, number>();

  for (const tag of tags) {
    const { id, ...rest } = tag;

    if (!id) {
      throw new Error('unreachable');
    }

    const newId = await db.tags.add({ ...rest });
    // It's a number, I promise.
    tagIdMap.set(id, newId as number);
  }

  return tagIdMap;
}

export async function importEvents(
  events: Event[],
  tagIdMap: Map<number, number>
): Promise<number[]> {
  // We don't need a map for events since they're all going into the same metadata object.
  const eventIds = [];

  for (const event of events) {
    delete event.id;
    const { tagIds, ...rest } = event;

    const newId = await db.events.add({
      ...rest,
      tagIds: tagIds.map((id) => tagIdMap.get(id)).filter((id): id is number => id !== undefined),
    });
    // It's a number, I promise.
    eventIds.push(newId as number);
  }

  return eventIds;
}

export async function importMetadata(metadata: Metadata): Promise<number> {
  delete metadata.id;
  return db.metadata.add(metadata) as Promise<number>;
}

export async function deleteDatabase() {
  console.log('Deleting database...');
  await db.delete();
  console.log('Database deleted.');
}

export interface Timeline {
  id?: number;
  version: number;

  events: TimelineEvent[];

  name?: string;
  description?: string;
  start: DateTime;
  end: DateTime;

  createdOn: Date;
  lastModified: Date;
}

export interface TimelineMetadata {
  id?: number;
  name?: string;
  description?: string;
  start: DateTime;
  end: DateTime;
}

export interface TimelineEvent {
  id?: number;

  name: string;
  description?: string;
  start: DateTime;
  end?: DateTime;
  tagIds: number[];

  createdOn: Date;
  lastModified: Date;
}
