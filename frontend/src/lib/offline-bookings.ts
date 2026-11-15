import { apiRequest } from './api-client';

const QUEUE_KEY = 'sevasetu-pending-bookings';
export type OfflineBooking = { id: string; ownerId: string; serviceId: string; createdAt: string };

function readQueue(): OfflineBooking[] {
  try { const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function writeQueue(queue: OfflineBooking[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }

export function queueOfflineBooking(serviceId: string): string {
  const token = localStorage.getItem('sevasetu-token');
  if (!token) throw new Error('Sign in while online before saving bookings offline.');
  const ownerId = token.split('.', 1)[0];
  const id = crypto.randomUUID();
  writeQueue([...readQueue(), { id, ownerId, serviceId, createdAt: new Date().toISOString() }]);
  return id;
}

let flushing = false;
export async function flushOfflineBookings() {
  if (flushing || !navigator.onLine) return;
  const token = localStorage.getItem('sevasetu-token');
  if (!token) return;
  const ownerId = token.split('.', 1)[0];
  flushing = true;
  try {
    const queue = readQueue();
    if (!queue.length) return;
    const queuedIds = new Set(queue.map((item) => item.id));
    const remaining: OfflineBooking[] = [];
    for (const item of queue) {
      if (item.ownerId !== ownerId) { remaining.push(item); continue; }
      try {
        const result = await apiRequest<{ booking: { id: string } }>('/bookings', {
          method: 'POST', body: JSON.stringify({ serviceId: item.serviceId, paymentMethod: 'cod', clientRequestId: item.id }),
        });
        window.dispatchEvent(new CustomEvent('sevasetu-offline-booking-synced', { detail: { queueId: item.id, bookingId: result.booking.id } }));
      } catch { remaining.push(item); }
    }
    // Preserve newly queued requests that arrived while the current batch synced.
    const addedDuringSync = readQueue().filter((item) => !queuedIds.has(item.id));
    writeQueue([...remaining, ...addedDuringSync]);
  } finally { flushing = false; }
}

export function pendingOfflineBookings() { return readQueue(); }
