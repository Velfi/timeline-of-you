import { DateTime } from '$lib/types/date';
import { readable } from 'svelte/store';

export { timeline, preferredEventTimezone } from './timeline';
export { notifications } from './notifications';

export const now = readable(
  new DateTime(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes(),
  ),
  function start(set) {
    const interval = setInterval(() => {
      const currentDate = new Date();
      set(
        new DateTime(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes(),
        ),
      );
    }, 1000);

    return function stop() {
      clearInterval(interval);
    };
  },
);
