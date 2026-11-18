// Función serverless de Vercel: devuelve los servidores ICE (STUN + TURN) para WebRTC.
// Variables de entorno (Vercel > Settings > Environment Variables):
//   METERED_DOMAIN   -> p. ej. "tuapp.metered.live"
//   METERED_API_KEY  -> la API key de "TURN Credentials" de Metered
// Alternativa con credenciales estáticas de cualquier proveedor TURN:
//   TURN_URLS (separadas por comas), TURN_USERNAME, TURN_CREDENTIAL

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let cache = { servers: null, expiresAt: 0 };

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const now = Date.now();
  if (cache.servers && cache.expiresAt > now) {
    res.status(200).send(JSON.stringify({ iceServers: cache.servers, turn: true }));
    return;
  }

  const { METERED_DOMAIN, METERED_API_KEY, TURN_URLS, TURN_USERNAME, TURN_CREDENTIAL } = process.env;

  try {
    if (METERED_DOMAIN && METERED_API_KEY) {
      const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${encodeURIComponent(METERED_API_KEY)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Metered respondió ${response.status}`);
      const turnServers = await response.json();
      const servers = [...STUN_SERVERS, ...turnServers];
      cache = { servers, expiresAt: now + 10 * 60 * 1000 };
      res.status(200).send(JSON.stringify({ iceServers: servers, turn: true }));
      return;
    }

    if (TURN_URLS && TURN_USERNAME && TURN_CREDENTIAL) {
      const servers = [
        ...STUN_SERVERS,
        {
          urls: TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean),
          username: TURN_USERNAME,
          credential: TURN_CREDENTIAL,
        },
      ];
      res.status(200).send(JSON.stringify({ iceServers: servers, turn: true }));
      return;
    }
  } catch (err) {
    console.error('No se pudieron obtener credenciales TURN:', err);
  }

  res.status(200).send(JSON.stringify({ iceServers: STUN_SERVERS, turn: false }));
}
