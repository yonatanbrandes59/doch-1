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

        // בוקר בשעה 8
        if (hour === 8 && lastMorningReminder !== today) {
          sendNotification('🌅 תזכורת בוקר', 'זכור/י לבדוק את סטטוס הסניפים!');
          set({ lastMorningReminder: today });
        }

        // ערב בשעה 20
        if (hour === 20 && lastEveningReminder !== today) {
          sendNotification('🌙 תזכורת ערב', 'זכור/י לסיים את דיווחי הערב!');
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
