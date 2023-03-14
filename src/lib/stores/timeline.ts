import { writable, get, readonly, type Readable } from 'svelte/store';
import { db, type Event, type Timeline } from '$lib/db';

export const timeline = createTimelineStore();

export interface TimelineStore {
  loadFromDb: (id: string) => Promise<void>;
  saveToDb: () => Promise<void>;
  addEvent: (event: Event) => void;
  isLoading: Readable<boolean>;
  hasChanges: Readable<boolean>;
  metadata: Readable<Timeline | undefined>;
  events: Readable<Event[] | undefined>;
}

function createTimelineStore(): TimelineStore {
  const timeline = writable<Timeline | undefined>();
  const events = writable<Event[] | undefined>();
  const hasChanges = writable(false);
  const isLoading = writable(false);

  const loadFromDb = async (id: string) => {
    isLoading.set(true);
    const tl = await db.timelines.get(parseInt(id, 10));
    timeline.set(tl);
    if (tl) {
      const ev = (await db.events.bulkGet(tl.events)).filter((e) => e !== undefined) as Event[];
      events.set(ev);
    }
    isLoading.set(false);
  };

  const saveToDb = async () => {
    const _timeline = get(timeline);
    const _events = get(events);

    if (!_timeline || !_events) {
      throw new Error('Tried to save timeline and events but none were ever set.');
    }

    if (!_timeline.id) {
      throw new Error('Tried to save timeline but it had no ID.');
    }

    await db.timelines.put(_timeline);
    // TODO ensure this will overwrite existing events with the same ID
    await db.events.bulkPut(_events);
  };

  const addEvent = (event: Event) => {
    events.update((events) => {
      if (events) {
        return [...events, event];
      } else {
        throw new Error('Tried to add event to timeline but no timeline was loaded.');
      }
    });

    hasChanges.set(true);
  };

  return {
    loadFromDb,
    saveToDb,
    addEvent,
    isLoading: readonly(isLoading),
    hasChanges: readonly(hasChanges),
    metadata: readonly(timeline),
    events: readonly(events),
  };
}
