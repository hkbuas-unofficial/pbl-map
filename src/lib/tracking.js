// Anonymous event tracking to Cloudflare Worker API
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@pbl_device_id';

const API_BASE = 'https://pbl-map-api.hkbuas.workers.dev';

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

async function postJson(path, body) {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function trackEvent(eventType, { deviceId = null, boothId = null, metadata = null } = {}) {
  try {
    const id = deviceId || await getDeviceId();
    await postJson('/api/track', {
      device_id: id,
      event_type: eventType,
      booth_id: boothId,
      metadata: metadata,
    });
  } catch (e) {
    console.log('Track error:', e.message);
  }
}

// Session tracking — NO heartbeat to save D1 writes
// Only writes on session start and session end
export async function startSession(deviceId = null) {
  try {
    const id = deviceId || await getDeviceId();
    await postJson('/api/session/start', { device_id: id });
  } catch (e) {
    console.log('Session start error:', e.message);
  }
}

export async function endSession(deviceId = null) {
  try {
    const id = deviceId || await getDeviceId();
    // Use sendBeacon for reliable delivery on page unload
    const url = `${API_BASE}/api/session/end`;
    const body = JSON.stringify({ device_id: id });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      await postJson('/api/session/end', { device_id: id });
    }
  } catch (e) {
    console.log('Session end error:', e.message);
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
