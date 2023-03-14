import { readable } from 'svelte/store';

export { timeline } from './timeline';
export { notifications } from './notifications';

export const now = readable(new Date(), function start(set) {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  return function stop() {
    clearInterval(interval);
  };
});
