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

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      // Prefer Service Worker notifications for better PWA/Mobile support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          console.log(`[Notification] Sending via ServiceWorker: ${title}`, options);
          await registration.showNotification(title, {
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [200, 100, 200],
            ...options,
          } as any);
          return;
        }
      }

      // Fallback to standard Notification
      console.log(`[Notification] Sending via Legacy API: ${title}`, options);
      new Notification(title, {
        icon: '/icon.png',
        ...options,
      });
    } catch (e) {
      console.error('Failed to send notification', e);
    }
  }
};
