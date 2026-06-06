// Cloudflare Worker API for PBL Map Analytics
// Bind D1 database as "DB" in wrangler.toml

const ADMIN_PASSWORD = 'pbl5**';

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

  // Upsert user (first_seen stays, last_seen updates)
  await db
    .prepare(
      `INSERT INTO users (device_id, last_seen, total_stamps, redemptions)
       VALUES (?, datetime('now'), 0, 0)
       ON CONFLICT(device_id) DO UPDATE SET last_seen = datetime('now')`
    )
    .bind(device_id)
    .run();

  // Insert event
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

  // Update user stats for stamp/redemption events
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

async function handleStats(db) {
  const [
    totalUsers,
    totalEvents,
    totalRedemptions,
    avgStamps,
    topBooths,
    recentEvents,
    activeNow,
    activeToday,
    stampDistribution,
    eventBreakdown,
  ] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM users`).first(),
    db.prepare(`SELECT COUNT(*) as count FROM events`).first(),
    db.prepare(`SELECT SUM(redemptions) as count FROM users`).first(),
    db.prepare(`SELECT AVG(total_stamps) as avg FROM users`).first(),
    db
      .prepare(
        `SELECT booth_id, COUNT(*) as visits
         FROM events WHERE booth_id IS NOT NULL
         GROUP BY booth_id ORDER BY visits DESC LIMIT 5`
      )
      .all(),
    db
      .prepare(
        `SELECT event_type, booth_id, created_at
         FROM events ORDER BY created_at DESC LIMIT 20`
      )
      .all(),
    db
      .prepare(
        `SELECT COUNT(DISTINCT device_id) as count FROM events
         WHERE created_at > datetime('now', '-5 minutes')`
      )
      .first(),
    db
      .prepare(
        `SELECT COUNT(DISTINCT device_id) as count FROM events
         WHERE created_at > datetime('now', '-24 hours')`
      )
      .first(),
    db
      .prepare(
        `SELECT total_stamps as stamps, COUNT(*) as users
         FROM users GROUP BY total_stamps ORDER BY total_stamps`
      )
      .all(),
    db
      .prepare(
        `SELECT event_type, COUNT(*) as count
         FROM events GROUP BY event_type ORDER BY count DESC`
      )
      .all(),
  ]);

  return jsonResponse({
    totalUsers: totalUsers?.count ?? 0,
    totalEvents: totalEvents?.count ?? 0,
    totalRedemptions: totalRedemptions?.count ?? 0,
    avgStamps: Math.round((avgStamps?.avg || 0) * 10) / 10,
    activeNow: activeNow?.count ?? 0,
    activeToday: activeToday?.count ?? 0,
    topBooths: topBooths?.results || [],
    recentEvents: (recentEvents?.results || []).map((r) => ({
      ...r,
      metadata: undefined,
    })),
    stampDistribution: stampDistribution?.results || [],
    eventBreakdown: eventBreakdown?.results || [],
  });
}

async function handleAdminVerify(request) {
  const body = await request.json();
  return jsonResponse({ valid: body?.password === ADMIN_PASSWORD });
}

async function handleExport(db) {
  const [users, events, redemptions] = await Promise.all([
    db.prepare(`SELECT * FROM users ORDER BY first_seen`).all(),
    db.prepare(`SELECT * FROM events ORDER BY created_at`).all(),
    db.prepare(`SELECT * FROM redemptions ORDER BY created_at`).all(),
  ]);

  return jsonResponse({
    exportedAt: new Date().toISOString(),
    users: users?.results || [],
    events: events?.results || [],
    redemptions: redemptions?.results || [],
  });
}
