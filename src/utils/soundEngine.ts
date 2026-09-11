/**
 * Motor de audio sintetizado con Web Audio API de alta fidelidad para "The Floor".
 * No requiere archivos externos, funciona instantáneamente y sin latencia.
 * También provee reproductor para canciones/audios de categorías musicales.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentMusicAudio: HTMLAudioElement | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.currentMusicAudio) {
      this.currentMusicAudio.pause();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Pitidos de cuenta atrás (3, 2, 1, ¡YA!)
   */
  public playCountdownBeep(isFinal = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = isFinal ? 1200 : 600;
      const duration = isFinal ? 0.4 : 0.15;

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (isFinal) {
        osc.frequency.exponentialRampToValueAtTime(1800, now + duration);
      }

      gain.gain.setValueAtTime(isFinal ? 0.3 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  /**
   * Tic-tac del reloj de duelo
   */
  public playTick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  /**
   * Alarma de advertencia de últimos 5 segundos (volumen suave y controlado)
   */
  public playWarning() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.07, ctx.currentTime); // Volumen atenuado y no molesto
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  /**
   * Acierto: Campana brillante con armónicos de triunfo
   */
  public playCorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const freqs = [1046.5, 1318.5, 1567.98];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);

        gain.gain.setValueAtTime(0.2 - i * 0.04, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.03);
        osc.stop(now + 0.35 + i * 0.03);
      });
    } catch {}
  }

  /**
   * Paso / Fallo: Tono descendente
   */
  public playPass() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /**
   * Bocina de tiempo agotado / derrota (volumen calibrado más suave)
   */
  public playBuzzer() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [130, 145, 175].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        // Volumen reducido a 0.12 para que no aturda
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.setValueAtTime(0.10, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.9);
      });
    } catch {}
  }

  /**
   * Conquista de territorio en el tablero
   */
  public playConquer() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.4);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  /**
   * Ruleta del suelo seleccionando (blip estándar)
   */
  public playRouletteBlip(pitch = 500) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, now + 0.04);

      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Golpe de tensión / latido dramático para la desaceleración de la ruleta
   */
  public playTensionTick(progress: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Oscilador de impacto grave (bombo / pulso de tensión)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // De 400Hz baja a 80Hz según progresa el suspense
      const startFreq = 350 - progress * 180;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

      gain.gain.setValueAtTime(0.18 + progress * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      // Añadir chasquido de reloj superior
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(800 - progress * 300, now);
      clickGain.gain.setValueAtTime(0.08, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);
    } catch {}
  }

  /**
   * Impacto dramático (sting) al revelarse el concursante elegido en la ruleta con tensión
   */
  public playDramaticSting() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Sub-impacto grave potente
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.6);

      // Acorde triunfal de revelación
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.02);
        gain.gain.setValueAtTime(0.18, now + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.02);
        osc.stop(now + 0.8 + i * 0.02);
      });
    } catch {}
  }

  /**
   * Genera aplausos de multitud sintetizados con Web Audio API
   */
  public playApplause(durationSeconds = 3.5, volume = 0.22) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * durationSeconds);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Ruido base de ambiente de público
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }

      // Añadir impulsos de palmadas individuales superpuestas
      const totalClaps = Math.floor(durationSeconds * 35);
      for (let c = 0; c < totalClaps; c++) {
        const clapStart = Math.floor(Math.random() * (bufferSize - 2500));
        const clapLen = Math.floor(800 + Math.random() * 1200);
        const amp = 0.5 + Math.random() * 0.7;
        for (let j = 0; j < clapLen && (clapStart + j) < bufferSize; j++) {
          const env = Math.exp(-j / (clapLen * 0.22));
          data[clapStart + j] += (Math.random() * 2 - 1) * amp * env;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Filtro paso banda para dar timbre acústico de palmas humanas
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(1.1, now);

      // Filtro paso alto para eliminar frecuencias excesivamente graves
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(600, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.25);
      gain.gain.setValueAtTime(volume, now + Math.max(0.3, durationSeconds - 0.7));
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + durationSeconds);
    } catch {}
  }

  /**
   * Genera un silbido de euforia/celebración realista
   */
  public playWhistle(delay = 0, duration = 0.75, baseFreq = 2100) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Oscilador de tono puro para silbido humano
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 0.8, start);
      // Glissando ascendente característico de silbido de ovación
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, start + duration * 0.35);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, start + duration);

      // Vibrato sutil para naturalidad
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(7.5, start);
      lfoGain.gain.setValueAtTime(35, start);
      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gain.gain.setValueAtTime(0.12, start + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      lfo.start(start);
      lfo.stop(start + duration);
      osc.start(start);
      osc.stop(start + duration);
    } catch {}
  }

  /**
   * Fanfarria de victoria con ovación de aplausos y silbidos
   */
  public playVictory(isGrandChampion = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Fanfarria melódica brillante
      const melody = isGrandChampion
        ? [
            { f: 523.25, t: 0.0, d: 0.16 }, // C5
            { f: 659.25, t: 0.15, d: 0.16 }, // E5
            { f: 783.99, t: 0.3, d: 0.16 }, // G5
            { f: 1046.5, t: 0.45, d: 0.3 }, // C6
            { f: 880.0, t: 0.75, d: 0.2 }, // A5
            { f: 1046.5, t: 0.95, d: 0.2 }, // C6
            { f: 1318.51, t: 1.15, d: 0.9 }, // E6
          ]
        : [
            { f: 523.25, t: 0.0, d: 0.14 },
            { f: 659.25, t: 0.14, d: 0.14 },
            { f: 783.99, t: 0.28, d: 0.14 },
            { f: 1046.5, t: 0.42, d: 0.7 },
          ];

      melody.forEach(note => {
        // Voz armónica principal
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);
        gain.gain.setValueAtTime(0.24, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);

        // Subarmónico para brillo tipo metal/trompeta
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(note.f, now + note.t);
        subGain.gain.setValueAtTime(0.08, now + note.t);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now + note.t);
        subOsc.stop(now + note.t + note.d);
      });

      // Aplausos de fondo
      const applauseDuration = isGrandChampion ? 5.5 : 3.5;
      this.playApplause(applauseDuration, isGrandChampion ? 0.28 : 0.22);

      // Silbidos de euforia del público: EXCLUSIVOS para la Gran Final
      if (isGrandChampion) {
        this.playWhistle(0.35, 0.75, 2100);
        this.playWhistle(0.9, 0.8, 2500);
        this.playWhistle(1.6, 0.85, 1900);
        this.playWhistle(2.4, 0.75, 2700);
        this.playWhistle(3.3, 0.8, 2300);
      }
    } catch {}
  }

  /**
   * Reproductor para clips de canciones / audio
   */
  public playMusicClip(url: string) {
    if (this.isMuted) return;
    this.stopMusicClip();
    try {
      this.currentMusicAudio = new Audio(url);
      this.currentMusicAudio.play().catch(() => {});
    } catch {}
  }

  public stopMusicClip() {
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause();
      this.currentMusicAudio = null;
    }
  }
}

export const soundEngine = new SoundEngine();
