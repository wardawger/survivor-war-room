// Pro Football Network publishes a consensus power ranking (PFSN/ESPN/NFL/CBS/Fox averaged per team) as
// server-rendered Next.js data embedded in the page's __NEXT_DATA__ script tag — no API key, no JS rendering,
// no scraping service needed. Used as the third component of the weighted Power Score.
const TEAM_CODE_OVERRIDES = { wsh: 'WAS' };

exports.handler = async () => {
  try {
    const res = await fetch('https://www.profootballnetwork.com/power-rankings-nfl/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return { statusCode: 502, body: JSON.stringify({ error: `PFN responded ${res.status}` }) };
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return { statusCode: 502, body: JSON.stringify({ error: 'Could not find __NEXT_DATA__ on page' }) };
    const data = JSON.parse(match[1]);
    const teams = data?.props?.pageProps?.initialRankings || [];
    const ratings = {};
    for (const t of teams) {
      if (!t.teamId || t.averageRank == null) continue;
      const code = TEAM_CODE_OVERRIDES[t.teamId] || t.teamId.toUpperCase();
      ratings[code] = t.averageRank;
    }
    if (Object.keys(ratings).length < 30) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Parsed fewer than 30 teams, page structure may have changed', found: Object.keys(ratings).length }) };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600' },
      body: JSON.stringify(ratings)
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
