import type { NotificationType, Notification } from '$lib/types/notification';
import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';

export const notifications = createNotifications();

function createNotifications() {
  const { subscribe, set, update } = writable<Array<Notification>>([]);
  const add = (type: NotificationType, message: string) =>
    update((notifications) => {
      notifications.push({
        id: nanoid(),
        message,
        type,
        timestamp: new Date(),
      });
      return notifications;
    });
  const dismiss = (id: string) =>
    update((notifications) => {
      return notifications.filter((n) => n.id !== id);
    });
  const dismissAll = () => set([]);

  return {
    subscribe,
    add,
    dismiss,
    dismissAll,
  };
}
