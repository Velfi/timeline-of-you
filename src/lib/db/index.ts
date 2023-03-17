import Dexie, { type Table } from 'dexie';
import type { Metadata, Event, Tag } from './v1';

export const TIMELINE_SCHEMA_VERSION = 1;

export class TimelineDexie extends Dexie {
  // These tables are added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  metadata!: Table<Metadata>;
  events!: Table<Event>;
  tags!: Table<Tag>;

  constructor() {
    super('timelineDatabase');
    // v1 2023-03-11 - initial version
    this.version(TIMELINE_SCHEMA_VERSION).stores({
      metadata: '++id, name, start, end, createdOn, lastModified',
      events: '++id, name, start, end, metadataId, createdOn, lastModified',
      tags: '++id, &name, *eventIds, createdOn, lastModified',
    });
  }
}

export async function deleteTimelineById(id: string) {
  const metadata = await db.metadata.get(parseInt(id, 10));
  console.log(`Deleting timeline with ID ${metadata?.id}...`);

  // Metadata can't be both undefined and have an ID, but I put the ID check here so I can use the
  // ID to delete the metadata after I've deleted the events.
  if (metadata === undefined || metadata.id === undefined) {
    throw new Error(
      'deleteTimelineById was called with an ID that does not exist in the database.'
    );
  }

  const eventIds = (await db.events.bulkGet(metadata.events))
    .filter((e): e is Event => e !== undefined)
    .map((e) => e.id)
    .filter((id): id is string => id !== undefined)
    .map((id) => parseInt(id, 10));

  await db.events.bulkDelete(eventIds);
  await db.metadata.delete(metadata.id);

  // TODO - delete tags that are no longer referenced by any events
  // deleteOrphanedTags();
}

export const db = new TimelineDexie();
export type { Metadata, Event, Tag } from './v1';
export type { Timeline } from './v1';
