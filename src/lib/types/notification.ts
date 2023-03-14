export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
}

export type NotificationType = 'success' | 'error' | 'info';
