import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReminderState {
  enabled: boolean;
  lastMorningReminder: string | null;
  lastEveningReminder: string | null;

  toggleReminders: (enabled: boolean) => void;
  checkAndSendReminders: () => void;
}

export const useReminders = create<ReminderState>()(
  persist(
    (set, get) => ({
      enabled: true,
      lastMorningReminder: null,
      lastEveningReminder: null,

      toggleReminders: (enabled) => {
        set({ enabled });
      },

      checkAndSendReminders: () => {
        const { enabled, lastMorningReminder, lastEveningReminder } = get();
        if (!enabled) return;

        const now = new Date();
        const hour = now.getHours();
        const today = now.toDateString();

        // בוקר בין 8:00–8:59
        if (hour >= 8 && hour < 9 && lastMorningReminder !== today) {
          sendNotification('🌅 תזכורת בוקר', 'זכור/י לשלוח דוח בוקר עד 08:00');
          set({ lastMorningReminder: today });
        }

        // ערב בין 20:00–20:59
        if (hour >= 20 && hour < 21 && lastEveningReminder !== today) {
          sendNotification('🌙 תזכורת ערב', 'זכור/י לשלוח דוח ערב עד 20:00');
          set({ lastEveningReminder: today });
        }
      },
    }),
    {
      name: 'doch1.reminders',
    },
  ),
);

function sendNotification(title: string, body: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}
