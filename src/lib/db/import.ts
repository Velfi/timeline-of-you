import { importEvents, importMetadata, importTags } from './';
import { importV1Timeline } from './v1/import';
import { isObject } from 'lodash-es';
import type { V1Timeline } from './v1';

function isAnObjectWithAVersionField(obj: unknown): obj is { version: unknown } {
  return isObject(obj) && !Array.isArray(obj) && 'version' in obj;
}

export async function importJSON(input: string): Promise<number> {
  const maybeTimeline = JSON.parse(input);

  if (!isAnObjectWithAVersionField(maybeTimeline)) {
    throw new Error('Invalid timeline file');
  }

  const version = maybeTimeline.version;

  switch (version) {
    case 1: {
      const v1Timeline = importV1Timeline(maybeTimeline);
      return insertV1TimelineIntoDB(v1Timeline);
    }
    default:
      throw new Error(`Unknown timeline version: ${version}`);
  }
}

async function insertV1TimelineIntoDB(timeline: V1Timeline): Promise<number> {
  const { metadata, events, tags } = timeline;

  const tagIdMap = await importTags(tags);
  metadata.eventIds = await importEvents(events, tagIdMap);
  return importMetadata(metadata);
}
