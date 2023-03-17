import { uniq } from 'lodash';
import { db, TIMELINE_SCHEMA_VERSION, type Event, type Tag, type Timeline } from './';

/**
 * Given a timeline ID, find that timeline in the database, along with all related
 * events and tags. Then bundle them into a single object and return it.
 */
export async function exportTimelineById(id: string): Promise<Timeline> {
  const metadata = await db.timelines.get(parseInt(id, 10));

  if (metadata === undefined) {
    throw new Error(
      'exportTimelineById was called with an ID that does not exist in the database.'
    );
  }

  const events = (await db.events.bulkGet(metadata.events)).filter(
    (e): e is Event => e !== undefined
  );

  if (events.length !== metadata.events.length) {
    throw new Error(
      `Timeline with ID ${metadata.id} has ${metadata.events.length} events but only ${events.length} were found in the database.`
    );
  }

  const tagIds = uniq(events.flatMap((e) => e.tags));
  const tags = (await db.tags.bulkGet(tagIds)).filter((t): t is Tag => t !== undefined);

  if (tags.length !== tagIds.length) {
    throw new Error(
      `Timeline with ID ${metadata.id} has events referencing ${tagIds.length} unique tags but only ${tags.length} were found in the database.`
    );
  }

  return {
    version: TIMELINE_SCHEMA_VERSION,
    metadata,
    events,
    tags,
  };
}
