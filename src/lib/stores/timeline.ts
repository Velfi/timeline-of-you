import { writable, get, readonly, type Readable } from 'svelte/store';
import { db } from '$lib/db';
import type { Event, Metadata, Tag } from '$lib/db';
import * as dateFns from 'date-fns';
import { importJSON } from '$lib/db/import';
import type { IndexableType } from 'dexie';

export const preferredEventTimezone = writable(dateFns.format(new Date(), 'XXX'));
export const timeline = createTimelineStore();

export interface TimelineStore {
  loadFromDb: (id: string) => Promise<void>;
  saveToDb: () => Promise<void>;
  addEvent: (event: Event) => Promise<void>;
  addEvents: (events: Event[]) => Promise<void>;
  loadFromJSON: (t: string) => void;
  isLoading: Readable<boolean>;
  hasChanges: Readable<boolean>;
  metadata: Readable<Metadata | undefined>;
  events: Readable<Event[] | undefined>;
  tags: Readable<Tag[] | undefined>;
}

function createTimelineStore(): TimelineStore {
  const metadata = writable<Metadata | undefined>();
  const events = writable<Event[] | undefined>();
  const tags = writable<Tag[] | undefined>();
  const hasChanges = writable(false);
  const isLoading = writable(false);

  const loadFromDb = async (id: string) => {
    isLoading.set(true);
    const tl = await db.timelines.get(parseInt(id, 10));
    const tz = tl?.start.timeZone;
    // Since many people live most of their life in the same timezone, we assume
    // defaulting to the timezone of the timeline's start date is helpful.
    if (tz) {
      console.log('Successfully loaded preferred timezone from timeline.');
      preferredEventTimezone.set(tz);
    } else {
      console.log('Failed to load preferred timezone from timeline.', tl?.end);
    }

    metadata.set(tl);
    if (tl) {
      const ev = (await db.events.bulkGet(tl.events)).filter((e) => e !== undefined) as Event[];
      events.set(ev);
    }

    // TODO load tags

    isLoading.set(false);
  };

  const saveToDb = async () => {
    const _metadata = get(metadata);
    const _events = get(events);
    const _tags = get(tags);

    if (!_metadata || !_events || !_tags) {
      throw new Error('Tried to save timeline, events, and tags but none were ever set.');
    }

    if (_metadata.id) {
      console.log('saving timeline (origin: db)');
      // We've already updated events and tags when they were added to the timeline, so we only need
      // to commit the metadata to the DB.
      await db.timelines.put(_metadata);
    } else {
      console.log('saving timeline (origin: JSON)');

      // TODO - test that this actually works
      // This is a timeline that was loaded from JSON, not the database. We need to assign IDs to
      // it, its events, and its tags.
      const tagIdMap = new Map<number, IndexableType>();
      for (const tag of _tags) {
        if (!tag.id) {
          throw new Error('Tried to save timeline but a tag had no ID.');
        }

        const jsonId = parseInt(tag.id, 10);
        // Delete the old tag so the DB can assign a new one.
        delete tag.id;
        const dbId = await db.tags.add(tag);
        tagIdMap.set(jsonId, dbId);
      }

      const dbEventIds = [];
      for (const event of _events) {
        if (!event.id) {
          throw new Error('Tried to save timeline but an event had no ID.');
        }

        const dbTagIds = [];
        for (const tagId of event.tags) {
          const dbId = tagIdMap.get(parseInt(tagId, 10));

          if (dbId) {
            dbTagIds.push(dbId.toString());
          }
        }
        event.tags = dbTagIds;

        // Delete the old event so the DB can assign a new one.
        delete event.id;
        const dbId = await db.events.add(event);
        dbEventIds.push(dbId.toString());
      }

      _metadata.events = dbEventIds;
      await db.timelines.add(_metadata);
    }
    hasChanges.set(false);
    console.log('Timeline successfully saved to DB.');
  };

  const addEvent = async (newEvent: Event) => {
    const newEventId = await db.events.add(newEvent);
    events.update((it) => {
      metadata.update((metadata) => {
        if (metadata) {
          return {
            ...metadata,
            events: [...metadata.events, newEventId.toString()],
          };
        } else {
          throw new Error('Tried to add event to metadata store but no metadata store was loaded.');
        }
      });

      if (it) {
        return [...it, newEvent];
      } else {
        throw new Error('Tried to add event to event store but no event store was loaded.');
      }
    });

    hasChanges.set(true);
  };

  const addEvents = async (newEvents: Event[]) => {
    const newEventIds = (await db.events.bulkAdd(newEvents, undefined, {
      allKeys: true,
    })) as number[];
    events.update((it) => {
      // TODO verify this actually returns IDs for all events
      metadata.update((metadata) => {
        if (metadata) {
          metadata.events = [...metadata.events, ...newEventIds.map((id) => id.toString())];

          return metadata;
        } else {
          throw new Error('Tried to add event to metadata store but no metadata store was loaded.');
        }
      });

      if (it) {
        return [...it, ...newEvents];
      } else {
        throw new Error('Tried to add events to event store but no event store was loaded.');
      }
    });

    hasChanges.set(true);
  };

  const loadFromJSON = (tl: string) => {
    hasChanges.set(true);

    const parsedTL = importJSON(tl);
    metadata.set(parsedTL.metadata);
    events.set(parsedTL.events);
    tags.set(parsedTL.tags);
  };

  return {
    loadFromDb,
    saveToDb,
    loadFromJSON,
    addEvent,
    addEvents,
    isLoading: readonly(isLoading),
    hasChanges: readonly(hasChanges),
    metadata: readonly(metadata),
    events: readonly(events),
    tags: readonly(tags),
  };
}
