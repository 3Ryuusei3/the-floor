// Obtiene los servidores ICE (STUN + TURN) del endpoint /api/ice-servers (Vercel).
// Si no está disponible (p. ej. en `npm run dev`), usa solo STUN.

export const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let iceServersPromise: Promise<RTCIceServer[]> | null = null;

export function getIceServers(): Promise<RTCIceServer[]> {
  if (iceServersPromise) return iceServersPromise;

  iceServersPromise = (async () => {
    if (import.meta.env.DEV) return FALLBACK_ICE_SERVERS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch('/api/ice-servers', { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data?.iceServers) && data.iceServers.length > 0) {
        if (!data.turn) console.warn('[The Floor] TURN no configurado: solo STUN.');
        return data.iceServers as RTCIceServer[];
      }
    } catch (e) {
      console.warn('[The Floor] No se pudieron cargar los servidores ICE, usando STUN:', e);
      iceServersPromise = null; // reintentar la próxima vez
    } finally {
      clearTimeout(timeout);
    }
    return FALLBACK_ICE_SERVERS;
  })();

  return iceServersPromise;
}
