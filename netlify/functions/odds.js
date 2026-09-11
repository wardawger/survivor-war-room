exports.handler = async () => {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ODDS_API_KEY not configured' }) };
  }
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american`);
    const data = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: data
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
