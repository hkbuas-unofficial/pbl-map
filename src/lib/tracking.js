// Anonymous event tracking to Cloudflare Worker API
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@pbl_device_id';

// CHANGE THIS to your Cloudflare Worker URL after deployment
const API_BASE = 'https://pbl-map-api.YOUR_SUBDOMAIN.workers.dev';

let deviceIdCache = null;

async function getDeviceId() {
  if (deviceIdCache) return deviceIdCache;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'pbl_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  deviceIdCache = id;
  return id;
}

export async function trackEvent(eventType, { deviceId = null, boothId = null, metadata = null } = {}) {
  try {
    const id = deviceId || await getDeviceId();
    await fetch(`${API_BASE}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: id,
        event_type: eventType,
        booth_id: boothId,
        metadata: metadata,
      }),
    });
  } catch (e) {
    // Silently fail — tracking should never break the app
    console.log('Track error:', e.message);
  }
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function verifyAdmin(password) {
  const res = await fetch(`${API_BASE}/api/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  return data.valid === true;
}

export async function exportData() {
  const res = await fetch(`${API_BASE}/api/admin/export`);
  if (!res.ok) throw new Error('Failed to export');
  return res.json();
}
