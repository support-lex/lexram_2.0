import { getStoredData, setStoredData, STORAGE_KEYS } from './storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'deadline' | 'draft' | 'system';
}

export function generateNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  
  const notifications: Notification[] = [];
  const now = new Date();
  
  // 1. Deadline Notifications
  const events = getStoredData<any[]>('lexram_events', []);
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 7) {
      notifications.push({
        id: `notif-evt-${event.id}`,
        title: 'Upcoming Deadline',
        message: `${event.title} is coming up in ${diffDays} ${diffDays === 1 ? 'day' : 'days'} (${new Date(event.date).toLocaleDateString()}).`,
        date: now.toISOString(),
        read: false,
        type: 'deadline'
      });
    }
  });

  // 2. Draft Reminders
  const drafts = getStoredData<any[]>(STORAGE_KEYS.DRAFTS, []);
  drafts.forEach(draft => {
    const draftDate = new Date(draft.updatedAt || draft.createdAt);
    const diffTime = now.getTime() - draftDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 3) {
      notifications.push({
        id: `notif-draft-${draft.id}`,
        title: 'Draft Reminder',
        message: `Your draft '${draft.title}' hasn't been updated in ${diffDays} days.`,
        date: now.toISOString(),
        read: false,
        type: 'draft'
      });
    }
  });

  // Merge with existing notifications to preserve read state
  const existing = getStoredData<Notification[]>('lexram_notifications', []);
  
  const merged = notifications.map(newNotif => {
    const exist = existing.find(e => e.id === newNotif.id);
    return exist ? { ...newNotif, read: exist.read } : newNotif;
  });

  // Keep any existing system notifications that aren't auto-generated
  const systemNotifs = existing.filter(e => e.type === 'system');
  
  const finalNotifs = [...merged, ...systemNotifs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  setStoredData('lexram_notifications', finalNotifs);
  return finalNotifs;
}

export function markAsRead(id: string) {
  const existing = getStoredData<Notification[]>('lexram_notifications', []);
  const updated = existing.map(n => n.id === id ? { ...n, read: true } : n);
  setStoredData('lexram_notifications', updated);
  return updated;
}

export function markAllAsRead() {
  const existing = getStoredData<Notification[]>('lexram_notifications', []);
  const updated = existing.map(n => ({ ...n, read: true }));
  setStoredData('lexram_notifications', updated);
  return updated;
}
