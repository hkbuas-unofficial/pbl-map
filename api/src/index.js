// Cloudflare Worker API for PBL Map Analytics
// Bind D1 database as "DB" in wrangler.toml

const ADMIN_PASSWORD = 'pbl5**';
const SESSION_TIMEOUT_MINUTES = 2;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      const db = env.DB;

      if (path === '/api/track' && request.method === 'POST') {
        return await handleTrack(request, db);
      }
      if (path === '/api/session/start' && request.method === 'POST') {
        return await handleSessionStart(request, db);
      }
      if (path === '/api/session/end' && request.method === 'POST') {
        return await handleSessionEnd(request, db);
      }
      if (path === '/api/stats' && request.method === 'GET') {
        return await handleStats(db);
      }
      if (path === '/api/admin/verify' && request.method === 'POST') {
        return await handleAdminVerify(request);
      }
      if (path === '/api/admin/export' && request.method === 'GET') {
        return await handleExport(db);
      }
      if (path === '/api/health' && request.method === 'GET') {
        return jsonResponse({ ok: true, time: new Date().toISOString() });
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  },
};

async function handleTrack(request, db) {
  const body = await request.json();
  const { device_id, event_type, booth_id, metadata } = body;

  if (!device_id || !event_type) {
    return jsonResponse({ error: 'Missing device_id or event_type' }, 400);
  }

  await db
    .prepare(
      `INSERT INTO users (device_id, last_seen, total_stamps, redemptions)
       VALUES (?, datetime('now'), 0, 0)
       ON CONFLICT(device_id) DO UPDATE SET last_seen = datetime('now')`
    )
    .bind(device_id)
    .run();

  await db
    .prepare(
      `INSERT INTO events (device_id, event_type, booth_id, metadata)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      device_id,
      event_type,
      booth_id || null,
      metadata ? JSON.stringify(metadata) : null
    )
    .run();

  if (event_type === 'stamp_earned') {
    await db
      .prepare(`UPDATE users SET total_stamps = total_stamps + 1 WHERE device_id = ?`)
      .bind(device_id)
      .run();
  }
  if (event_type === 'redemption') {
    const stampsUsed = metadata?.stamps_used || 3;
    await db
      .prepare(`UPDATE users SET redemptions = redemptions + 1 WHERE device_id = ?`)
      .bind(device_id)
      .run();
    await db
      .prepare(`INSERT INTO redemptions (device_id, stamps_used) VALUES (?, ?)`)
      .bind(device_id, stampsUsed)
      .run();
  }

  return jsonResponse({ success: true });
}

async function handleSessionStart(request, db) {
  const { device_id } = await request.json();
  if (!device_id) return jsonResponse({ error: 'Missing device_id' }, 400);

  await db
    .prepare(
      `INSERT INTO sessions (device_id, started_at, last_ping)
       VALUES (?, datetime('now'), datetime('now'))
       ON CONFLICT(device_id) DO UPDATE SET last_ping = datetime('now')`
    )
    .bind(device_id)
    .run();

  await db
    .prepare(
      `INSERT INTO users (device_id, last_seen, total_stamps, redemptions)
       VALUES (?, datetime('now'), 0, 0)
       ON CONFLICT(device_id) DO UPDATE SET last_seen = datetime('now')`
    )
    .bind(device_id)
    .run();

  return jsonResponse({ success: true });
}

async function handleSessionEnd(request, db) {
  const { device_id } = await request.json();
  if (!device_id) return jsonResponse({ error: 'Missing device_id' }, 400);

  await db.prepare(`DELETE FROM sessions WHERE device_id = ?`).bind(device_id).run();
  return jsonResponse({ success: true });
}

async function handleStats(db) {
  // Clean up stale sessions
  await db
    .prepare(
      `DELETE FROM sessions WHERE last_ping < datetime('now', '-${SESSION_TIMEOUT_MINUTES} minutes')`
    )
    .run();

  const [
    totalUsers,
    totalEvents,
    totalRedemptions,
    avgStamps,
    activeNow,
    activeToday,
    topBooths,
    eventBreakdown,
    visitorGraph,
  ] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM users`).first(),
    db.prepare(`SELECT COUNT(*) as count FROM events`).first(),
    db.prepare(`SELECT SUM(redemptions) as count FROM users`).first(),
    db.prepare(`SELECT AVG(total_stamps) as avg FROM users`).first(),
    db.prepare(`SELECT COUNT(*) as count FROM sessions`).first(),
    db
      .prepare(
        `SELECT COUNT(DISTINCT device_id) as count FROM events
         WHERE created_at > datetime('now', '-24 hours')`
      )
      .first(),
    db
      .prepare(
        `SELECT booth_id, COUNT(*) as visits
         FROM events WHERE booth_id IS NOT NULL
         GROUP BY booth_id ORDER BY visits DESC`
      )
      .all(),
    db
      .prepare(
        `SELECT event_type, COUNT(*) as count
         FROM events
         WHERE event_type IN ('stamp_earned', 'quiz_locked', 'redemption', 'booth_tap', 'scan')
         GROUP BY event_type ORDER BY count DESC`
      )
      .all(),
    getVisitorGraph(db),
  ]);

  return jsonResponse({
    totalUsers: totalUsers?.count ?? 0,
    totalEvents: totalEvents?.count ?? 0,
    totalRedemptions: totalRedemptions?.count ?? 0,
    avgStamps: Math.round((avgStamps?.avg || 0) * 10) / 10,
    activeNow: activeNow?.count ?? 0,
    activeToday: activeToday?.count ?? 0,
    topBooths: topBooths?.results || [],
    eventBreakdown: eventBreakdown?.results || [],
    visitorGraph: visitorGraph,
  });
}

async function getVisitorGraph(db) {
  const buckets = [];
  const now = new Date();
  const ms15min = 15 * 60 * 1000;
  const totalBuckets = 80;

  for (let i = totalBuckets - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * ms15min);
    t.setUTCSeconds(0, 0);
    t.setUTCMinutes(Math.floor(t.getUTCMinutes() / 15) * 15);
    buckets.push({
      label: `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`,
      iso: t.toISOString(),
      count: 0,
    });
  }

  const startTime = new Date(now.getTime() - totalBuckets * ms15min).toISOString();

  const rows = await db
    .prepare(
      `SELECT
        strftime('%Y-%m-%d %H:%M:00', created_at) as bucket,
        COUNT(DISTINCT device_id) as count
       FROM events
       WHERE created_at > ?
       GROUP BY bucket
       ORDER BY bucket`
    )
    .bind(startTime)
    .all();

  const countsByBucket = {};
  for (const r of rows?.results || []) {
    countsByBucket[r.bucket] = r.count;
  }

  for (const b of buckets) {
    const bucketKey = b.iso.slice(0, 16) + ':00';
    b.count = countsByBucket[bucketKey] || 0;
  }

  return buckets;
}

async function handleAdminVerify(request) {
  const body = await request.json();
  return jsonResponse({ valid: body?.password === ADMIN_PASSWORD });
}

async function handleExport(db) {
  const [users, events, redemptions, sessions] = await Promise.all([
    db.prepare(`SELECT * FROM users ORDER BY first_seen`).all(),
    db.prepare(`SELECT * FROM events ORDER BY created_at`).all(),
    db.prepare(`SELECT * FROM redemptions ORDER BY created_at`).all(),
    db.prepare(`SELECT * FROM sessions ORDER BY last_ping`).all(),
  ]);

  return jsonResponse({
    exportedAt: new Date().toISOString(),
    users: users?.results || [],
    events: events?.results || [],
    redemptions: redemptions?.results || [],
    sessions: sessions?.results || [],
  });
}
