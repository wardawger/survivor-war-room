exports.handler = async () => {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SPORTSGAMEODDS_API_KEY not configured' }) };
  }
  try {
    const url = 'https://api.sportsgameodds.com/v2/events?leagueID=NFL&oddsAvailable=true'
      + '&oddID=points-home-game-ml-home,points-away-game-ml-away&limit=50';
    const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
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
