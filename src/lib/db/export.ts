import { uniq } from 'lodash-es';
import type { Event, Tag } from './v1';
import { SCHEMA_VERSION, type TimelineDexie } from './';

/**
 * Given a timeline ID, find that timeline in the database, along with all related
 * events and tags. Then bundle them into a single object and return it.
 */
export async function exportJSON(id: number, db: TimelineDexie, pretty = true): Promise<string> {
  const metadata = await db.metadata.get(id);

  if (metadata === undefined) {
    throw new Error(
      'exportTimelineById was called with an ID that does not exist in the database.'
    );
  }

  const events = (await db.events.bulkGet(metadata.eventIds)).filter(
    (e): e is Event => e !== undefined
  );

  if (events.length !== metadata.eventIds.length) {
    throw new Error(
      `Timeline with ID ${metadata.id} has ${metadata.eventIds.length} events but only ${events.length} were found in the database.`
    );
  }

  const tagIds = uniq(events.flatMap((e) => e.tagIds));
  const tags = (await db.tags.bulkGet(tagIds)).filter((t): t is Tag => t !== undefined);

  if (tags.length !== tagIds.length) {
    throw new Error(
      `Timeline with ID ${metadata.id} has events referencing ${tagIds.length} unique tags but only ${tags.length} were found in the database.`
    );
  }

  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      metadata,
      events,
      tags,
    },
    null,
    pretty ? 2 : undefined
  );
}
