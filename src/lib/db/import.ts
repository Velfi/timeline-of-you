import type { Timeline } from './';
import { importV1Timeline } from './v1/import';
import { isObject } from 'lodash';

function isAnObjectWithAVersionField(obj: unknown): obj is { version: unknown } {
  return isObject(obj) && !Array.isArray(obj) && 'version' in obj;
}

export function importJSON(input: string): Timeline {
  const maybeTimeline = JSON.parse(input);

  if (!isAnObjectWithAVersionField(maybeTimeline)) {
    throw new Error('Invalid timeline file');
  }

  const version = maybeTimeline.version;

  let importedTimeline;

  switch (version) {
    case 1:
      importedTimeline = importV1Timeline(maybeTimeline);
      break;
    default:
      throw new Error(`Unknown timeline version: ${version}`);
  }

  return importedTimeline;
}
