import { writable, get, readonly, type Readable } from 'svelte/store';
import * as dateFns from 'date-fns';
import {
  getTimelineById,
  importTimelineFromJSON,
  saveTimelineToDb,
  type Timeline,
  type TimelineEvent,
} from '$lib/db';
import { DateTime } from '$lib/types/date';

const currentDateTime = new DateTime(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
  new Date().getHours(),
  new Date().getMinutes(),
);
export const preferredEventTimezone = writable(dateFns.format(currentDateTime.toDate(), 'XXX'));
export const timeline = createTimelineStore();

export interface TimelineStore {
  addEvent: (event: TimelineEvent) => Promise<void>;
  addEvents: (events: TimelineEvent[]) => Promise<void>;
  deleteEvent: (eventId: number) => Promise<void>;
  hasChanges: Readable<boolean>;
  isLoading: Readable<boolean>;
  loadFromDb: (id: number) => Promise<void>;
  loadFromJSON: (timelineString: string) => void;
  saveToDb: () => Promise<void>;
  timeline: Readable<Timeline | undefined>;
}

function createTimelineStore(): TimelineStore {
  const _timeline = writable<Timeline | undefined>();
  const _hasChanges = writable(false);
  const _isLoading = writable(false);

  function setPreferredTimezoneFromTimeline(tl: Timeline | undefined) {
    const tz = tl?.metadata.start.timeZone;
    // Since many people live most of their life in the same timezone, we assume
    // defaulting to the timezone of the timeline's start date is helpful.
    if (tz) {
      console.log('Successfully loaded preferred timezone from timeline.');
      preferredEventTimezone.set(tz);
    } else {
      console.log('Failed to load preferred timezone from timeline.', tl?.metadata.name);
    }
  }

  const loadFromDb = async (id: number) => {
    _isLoading.set(true);
    const tl = await getTimelineById(id);
    setPreferredTimezoneFromTimeline(tl);
    _timeline.set(tl);

    _isLoading.set(false);
  };

  const loadFromJSON = async (timelineString: string) => {
    _isLoading.set(true);
    const tl = await importTimelineFromJSON(timelineString);

    if (!tl) {
      console.log('Successfully loaded timeline from JSON.');
    }

    setPreferredTimezoneFromTimeline(tl);
    _timeline.set(tl);

    _isLoading.set(false);
  };

  const saveToDb = async () => {
    console.log('Saving timeline to DB...');
    const tl = get(_timeline);

    if (tl) {
      await saveTimelineToDb(tl);

      _hasChanges.set(false);
      console.log('Timeline successfully saved to DB.');
    } else {
      throw new Error('Failed to save timeline to DB.');
    }
  };

  const addEvent = async (newEvent: {
    name: string;
    description?: string;
    start: DateTime;
    end?: DateTime;
    tagIds: number[];
  }) => {
    _timeline.update((tl) => {
      if (tl) {
        tl.events.push({ ...newEvent, createdOn: new Date(), lastModified: new Date() });
        tl.metadata.lastModified = new Date();
        return tl;
      } else {
        throw new Error('Tried to add event to timeline but no timeline was loaded.');
      }
    });

    _hasChanges.set(true);
  };

  const addEvents = async (
    newEvents: {
      name: string;
      description?: string;
      start: DateTime;
      end?: DateTime;
      tagIds: number[];
    }[],
  ) => {
    _timeline.update((tl) => {
      if (tl) {
        for (const ev of newEvents) {
          tl.events.push({ ...ev, createdOn: new Date(), lastModified: new Date() });
        }

        tl.metadata.lastModified = new Date();
        return tl;
      } else {
        throw new Error('Tried to add event to timeline but no timeline was loaded.');
      }
    });

    _hasChanges.set(true);
  };

  const deleteEvent = async (eventId: number) => {
    _timeline.update((tl) => {
      if (tl) {
        tl.events = tl.events.filter((event) => event.id !== eventId);
        tl.metadata.lastModified = new Date();
        return tl;
      } else {
        throw new Error('Tried to delete event from timeline but no timeline was loaded.');
      }
    });

    _hasChanges.set(true);
  };

  return {
    addEvent,
    addEvents,
    deleteEvent,
    hasChanges: readonly(_hasChanges),
    isLoading: readonly(_isLoading),
    loadFromDb,
    loadFromJSON,
    saveToDb,
    timeline: readonly(_timeline),
  };
}

export const defaultEvent: TimelineEvent = {
  id: 0,
  name: '',
  description: '',
  start: new DateTime(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes(),
  ),
  createdOn: new Date(),
  lastModified: new Date(),
  tagIds: [],
};
