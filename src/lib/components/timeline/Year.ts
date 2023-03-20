import type { TimelineEvent } from '$lib/db';

export interface YearProps {
  isDecade: boolean;
  events: TimelineEvent[];
}
