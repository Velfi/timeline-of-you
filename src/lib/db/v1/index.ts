import type { Metadata } from './metadata';
import type { Tag } from './tag';
import type { Event } from './event';

export { Metadata, Tag, Event };
export { isProbablyEvent, fromJSON as EventFromJSON, toJSON as EventToJSON } from './event';
export {
  isProbablyMetadata,
  fromJSON as MetadataFromJSON,
  toJSON as MetadataToJSON,
} from './metadata';
export { isProbablyTag, fromJSON as TagFromJSON, toJSON as TagToJSON } from './tag';

export type V1Timeline = {
  version: 1;
  metadata: Metadata;
  events: Event[];
  tags: Tag[];
};
