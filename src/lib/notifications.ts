/**
 * Client-side notification service for Dash
 */

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon.png",
      badge: "/icon.png",
      ...options,
    });
  }
};

/**
 * Utility to schedule a local reminder
 * For client-side only, this relies on the app being open.
 */
export const scheduleReminder = (title: string, message: string, delayMs: number) => {
  if (delayMs <= 0) return;

  setTimeout(() => {
    sendNotification(title, { body: message });
  }, delayMs);
};
