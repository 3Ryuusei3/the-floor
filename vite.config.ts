import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

function networkInfoPlugin(): Plugin {
  interface RoomState {
    hostClients: Set<any>;
    judgeClients: Set<any>;
    lastState: any;
  }
  const rooms = new Map<string, RoomState>();

  function getOrCreateRoom(roomId: string): RoomState {
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        hostClients: new Set(),
        judgeClients: new Set(),
        lastState: null,
      };
      rooms.set(roomId, room);
    }
    return room;
  }

  function readJsonBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({});
        }
      });
    });
  }

  return {
    name: 'network-info-plugin',
    configureServer(server) {
      // 1. Detección de IPs de red local
      server.middlewares.use('/api/network-ip', (_req, res) => {
        const interfaces = os.networkInterfaces();
        const ips: string[] = [];
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
              ips.push(iface.address);
            }
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ ip: ips[0] || '127.0.0.1', allIps: ips }));
      });

      // 2. Stream SSE bidireccional de baja latencia para el Juez y Host (Local y WiFi)
      server.middlewares.use('/api/judge-stream', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        const url = new URL(req.url || '', 'http://localhost');
        const role = url.searchParams.get('role') || 'judge';
        const roomId = (url.searchParams.get('room') || 'DEFAULT').toUpperCase();

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
        res.write(': keep-alive\n\n');

        const room = getOrCreateRoom(roomId);

        if (role === 'host') {
          room.hostClients.add(res);
          if (room.judgeClients.size > 0) {
            res.write(`data: ${JSON.stringify({ type: 'JUDGE_PRESENCE', connected: true })}\n\n`);
          }
          req.on('close', () => {
            room.hostClients.delete(res);
          });
        } else {
          room.judgeClients.add(res);
          // Notificar a todos los hosts de que hay juez conectado
          for (const hostRes of room.hostClients) {
            try {
              hostRes.write(`data: ${JSON.stringify({ type: 'JUDGE_PRESENCE', connected: true })}\n\n`);
            } catch {}
          }
          // Enviar inmediatamente último estado si ya existe
          if (room.lastState) {
            res.write(`data: ${JSON.stringify({ type: 'STATE_SYNC', payload: room.lastState })}\n\n`);
          }
          req.on('close', () => {
            room.judgeClients.delete(res);
            if (room.judgeClients.size === 0) {
              for (const hostRes of room.hostClients) {
                try {
                  hostRes.write(`data: ${JSON.stringify({ type: 'JUDGE_PRESENCE', connected: false })}\n\n`);
                } catch {}
              }
            }
          });
        }
      });

      // 3. Envío de Estado desde el Host hacia el Juez
      server.middlewares.use('/api/judge-state', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          const body = await readJsonBody(req);
          const roomId = (body.roomId || 'DEFAULT').toUpperCase();
          const payload = body.payload;
          if (roomId && payload) {
            const room = getOrCreateRoom(roomId);
            room.lastState = payload;
            const msg = JSON.stringify({ type: 'STATE_SYNC', payload });
            for (const client of room.judgeClients) {
              try {
                client.write(`data: ${msg}\n\n`);
              } catch {}
            }
          }
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        res.writeHead(405).end();
      });

      // 4. Envío de Acciones desde el Mando del Juez hacia el Host
      server.middlewares.use('/api/judge-action', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          const body = await readJsonBody(req);
          const roomId = (body.roomId || 'DEFAULT').toUpperCase();
          const action = body.action;
          if (roomId && action) {
            const room = getOrCreateRoom(roomId);
            const msg = JSON.stringify({ type: 'JUDGE_ACTION', action });
            for (const client of room.hostClients) {
              try {
                client.write(`data: ${msg}\n\n`);
              } catch {}
            }
          }
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        res.writeHead(405).end();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), networkInfoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Escucha en 0.0.0.0 para acceso desde el móvil en la misma red WiFi
    port: 3000,
    open: true
  }
});
