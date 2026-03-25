export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Failed to request notification permission', e);
      return false;
    }
  }
  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon.png',
        ...options,
      });
    } catch (e) {
      console.error('Failed to send notification', e);
    }
  }
};
