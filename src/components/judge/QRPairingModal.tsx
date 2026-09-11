import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check, ExternalLink, X, Wifi, Settings, AppWindow } from 'lucide-react';

interface QRPairingModalProps {
  isOpen: boolean;
  roomId: string;
  isConnected: boolean;
  onClose: () => void;
}

export const QRPairingModal: React.FC<QRPairingModalProps> = ({
  isOpen,
  roomId,
  isConnected,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [showHostInput, setShowHostInput] = useState(false);
  const [detectedIps, setDetectedIps] = useState<string[]>([]);

  useEffect(() => {
    // Si no estamos en localhost, usar el hostname actual directamente
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCustomHost(window.location.hostname);
      return;
    }

    // Si estamos en localhost, consultar al servidor Vite la IP LAN real de esta máquina
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          setCustomHost(data.ip);
        }
        if (data.allIps && Array.isArray(data.allIps)) {
          setDetectedIps(data.allIps);
        }
      })
      .catch(() => {
        // Fallback a hostname local si no hay endpoint activo
        setCustomHost(window.location.hostname);
      });
  }, []);

  if (!isOpen) return null;

  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  // Host a usar en el QR: IP detectada o la configurada
  const effectiveHostname =
    customHost || (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname);

  const judgeUrl = `${protocol}//${effectiveHostname}${port}/?role=judge&room=${roomId}`;
  const localDirectUrl = `${protocol}//${window.location.host}/?role=judge&room=${roomId}`;

  const handleCopy = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPopup = () => {
    const width = 420;
    const height = 820;
    const left = window.screen.width - width - 50;
    const top = 60;
    window.open(
      localDirectUrl,
      'TheFloorJudgeRemote',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const isUsingLocalhost = effectiveHostname === 'localhost' || effectiveHostname === '127.0.0.1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-floor-surface border-2 border-floor-cyan/60 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-[0_0_60px_rgba(0,240,255,0.3)] relative max-h-[95vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-floor-card border border-floor-border cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-floor-card border border-floor-cyan/40 text-floor-cyan text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" /> Mando Móvil del Juez
          </div>
          <h2 className="text-2xl font-bold digital-font text-white">
            CONEXIÓN MODO JUEZ
          </h2>
          <p className="text-xs text-slate-300">
            Escanea desde tu móvil o pruébalo directamente en este ordenador.
          </p>
        </div>

        {/* Estado de Conexión */}
        <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-xl bg-floor-card border border-floor-border text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-floor-green animate-ping' : 'bg-floor-amber'
            }`}
          />
          <span className="font-semibold text-slate-200">
            {isConnected ? '🟢 Juez Conectado en Directo' : '🟡 Esperando conexión del Juez...'}
          </span>
        </div>

        {/* Contenedor del Código QR */}
        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white shadow-inner max-w-[190px] mx-auto">
          <QRCodeSVG value={judgeUrl} size={160} level="M" />
        </div>

        {/* IP Detectada e información */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-floor-card border border-floor-border text-slate-300">
            <Wifi className="w-4 h-4 text-floor-cyan flex-shrink-0" />
            <div className="flex-1 truncate font-mono text-[11px] text-slate-300">
              <span className="text-slate-500 mr-1">IP WiFi:</span>
              <strong className="text-floor-cyan">{effectiveHostname}</strong>
              <span className="text-slate-500 ml-1">Sala: {roomId}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(judgeUrl)}
              className="p-1.5 rounded-lg bg-floor-surface hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Copiar URL para el móvil"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-floor-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setShowHostInput(!showHostInput)}
              className="p-1.5 rounded-lg bg-floor-surface hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Cambiar IP de red WiFi manualmente"
            >
              <Settings className="w-3.5 h-3.5 text-floor-cyan" />
            </button>
          </div>

          {/* Ajuste manual de IP */}
          {showHostInput && (
            <div className="p-3 rounded-xl bg-floor-card border border-floor-border space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold block">
                IP Local de tu ordenador en la red WiFi:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="ej. 192.168.1.35"
                  className="flex-1 bg-floor-surface border border-floor-border px-3 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-floor-cyan"
                />
                <button
                  type="button"
                  onClick={() => setShowHostInput(false)}
                  className="px-3 py-1.5 rounded-lg bg-floor-cyan text-black font-bold text-xs cursor-pointer"
                >
                  OK
                </button>
              </div>
              {detectedIps.length > 1 && (
                <div className="pt-1 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400">Otras IPs detectadas:</span>
                  {detectedIps.map((ip) => (
                    <button
                      key={ip}
                      type="button"
                      onClick={() => setCustomHost(ip)}
                      className="px-1.5 py-0.5 rounded bg-floor-surface border border-slate-700 text-[10px] font-mono text-floor-cyan hover:border-floor-cyan"
                    >
                      {ip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isUsingLocalhost && (
            <p className="text-[11px] text-floor-amber text-center">
              ⚠️ Para conectar desde el móvil, usa la IP local (ej. 192.168.x.x) en lugar de localhost.
            </p>
          )}
        </div>

        {/* Botones de Prueba en Local */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleOpenPopup}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-floor-cyan/20 to-teal-500/20 border-2 border-floor-cyan text-white hover:bg-floor-cyan/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            <AppWindow className="w-4 h-4 text-floor-cyan" />
            <span>Probar Mando en Ventana Móvil (Local)</span>
          </button>

          <a
            href={localDirectUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-floor-card border border-floor-border hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-floor-cyan flex items-center justify-center gap-2 transition-colors text-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Mando en Nueva Pestaña
          </a>
        </div>
      </div>
    </div>
  );
};
