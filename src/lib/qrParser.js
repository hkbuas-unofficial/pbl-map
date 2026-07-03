// Parse scanned QR data to extract booth ID
// Supports:
// - Direct booth ID: "A1"
// - URL format: https://ourlinkiforgotwhatitis.workers.dev/id=?A1
// - URL format: https://ourlinkiforgotwhatitis.workers.dev/?id=A1

export function extractBoothId(rawData) {
  if (!rawData) return null;

  const data = String(rawData).trim();

  // If it's just a short ID (no URL), return it as-is (preserve case for group IDs like London-2)
  if (!data.includes('/') && !data.includes('?') && !data.includes('id=')) {
    return data;
  }

  try {
    const url = new URL(data);

    // Standard query param: ?id=A1
    const idFromQuery = url.searchParams.get('id');
    if (idFromQuery) return idFromQuery;

    // Custom format: /id=?A1
    // Path would be "/id=" and query would be "A1" (without key)
    if (url.pathname.toLowerCase() === '/id=') {
      // Query string like "?A1" — get raw query without ?
      const rawQuery = url.search.replace(/^\?/, '');
      if (rawQuery) return rawQuery;
    }

    // Another variant: /id=?A1 where everything after pathname is the query
    const pathMatch = url.pathname.match(/\/id=\?([A-Za-z0-9_-]+)$/i);
    if (pathMatch) return pathMatch[1];

    // Fallback: look for id= anywhere in URL
    const match = data.match(/[?&/]id=\??([A-Za-z0-9_-]+)/i);
    if (match) return match[1];
  } catch (e) {
    // Not a valid URL — try regex extraction anyway
    const match = data.match(/[?&/]id=\??([A-Za-z0-9_-]+)/i);
    if (match) return match[1];
  }

  // If nothing matched but it's short, treat as direct ID
  if (data.length <= 10) return data;

  return null;
}
