// Shared pool state (used teams, locked picks, cached weekly analysis, selected Power Score model) — one row,
// visible to everyone using the app, stored in Turso via its plain HTTP pipeline API (no SDK/dependency needed,
// consistent with the rest of this app's Netlify Functions). Replaces what used to live only in localStorage.
const DEFAULT_STATE = { usedTeams: [], picks: {}, cache: {}, powerModel: 'yalango' };

function turso(sql, args) {
  const url = process.env.TURSO_DATABASE_URL.replace(/^libsql:/, 'https:');
  const token = process.env.TURSO_AUTH_TOKEN;
  return fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args || [] } },
        { type: 'close' }
      ]
    })
  }).then(r => r.json());
}

exports.handler = async (event) => {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Turso not configured' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await turso('SELECT data FROM app_state WHERE id = 1');
      const rows = result?.results?.[0]?.response?.result?.rows;
      const data = rows && rows.length ? JSON.parse(rows[0][0].value) : DEFAULT_STATE;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(data)
      };
    }

    if (event.httpMethod === 'POST') {
      const state = JSON.parse(event.body);
      await turso(
        'INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
        [{ type: 'text', value: JSON.stringify(state) }, { type: 'text', value: new Date().toISOString() }]
      );
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
