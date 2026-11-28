export type SoundKind = "move" | "win" | "coin" | "click" | "error";

type NoteSpec = {
  freq: number;
  endFreq?: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
};

const NOTES: Record<SoundKind, NoteSpec[]> = {
  move: [
    { freq: 340, endFreq: 480, duration: 0.075, type: "sine", gain: 0.22 },
    { freq: 680, duration: 0.045, type: "triangle", delay: 0.015, gain: 0.1 },
  ],
  click: [
    { freq: 520, endFreq: 660, duration: 0.055, type: "triangle", gain: 0.2 },
  ],
  coin: [
    { freq: 880, duration: 0.09, type: "triangle", gain: 0.22 },
    { freq: 1318.5, duration: 0.16, type: "triangle", delay: 0.07, gain: 0.24 },
  ],
  error: [
    { freq: 220, endFreq: 165, duration: 0.15, type: "sawtooth", gain: 0.16 },
  ],
  win: [
    { freq: 523.25, duration: 0.13, type: "triangle", gain: 0.22 },
    { freq: 659.25, duration: 0.13, type: "triangle", delay: 0.1, gain: 0.22 },
    { freq: 783.99, duration: 0.16, type: "triangle", delay: 0.2, gain: 0.24 },
    { freq: 1046.5, duration: 0.3, type: "triangle", delay: 0.32, gain: 0.26 },
  ],
};

let context: AudioContext | null = null;
let unlocked = false;
let listenersInstalled = false;
const wavCache: Partial<Record<SoundKind, string>> = {};

/* ───────────── Тихая спокойная фоновая музыка (Ambient WebAudio) ───────────── */

const AMBIENT_CHORDS: number[][] = [
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [130.81, 196.0, 246.94, 293.66], // Cmaj9
  [146.83, 220.0, 261.63, 329.63], // Dm9
  [110.0, 164.81, 196.0, 261.63],  // Am7
];

const AMBIENT_MELODY: number[][] = [
  [523.25, 659.25, 587.33], // C5, E5, D5
  [493.88, 587.33, 523.25], // B4, D5, C5
  [440.0, 523.25, 659.25],  // A4, C5, E5
  [392.0, 523.25, 440.0],   // G4, C5, A4
];

let musicWanted = false;
let musicRunning = false;
let musicTimer: number | null = null;
let musicChordIndex = 0;
let musicMasterGain: GainNode | null = null;
let musicBusFilter: BiquadFilterNode | null = null;

function ensureMusicBus(audio: AudioContext): AudioNode {
  if (musicMasterGain && musicBusFilter) {
    return musicBusFilter;
  }
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, audio.currentTime);
  master.gain.linearRampToValueAtTime(0.045, audio.currentTime + 1.5);

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(720, audio.currentTime);
  filter.Q.setValueAtTime(0.6, audio.currentTime);

  // Мягкое пространственное эхо для спокойного эмбиент-звучания
  const delay = audio.createDelay(1.0);
  delay.delayTime.setValueAtTime(0.38, audio.currentTime);
  const feedback = audio.createGain();
  feedback.gain.setValueAtTime(0.24, audio.currentTime);
  const wetGain = audio.createGain();
  wetGain.gain.setValueAtTime(0.32, audio.currentTime);

  filter.connect(master);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(master);
  master.connect(audio.destination);

  musicMasterGain = master;
  musicBusFilter = filter;
  return filter;
}

function scheduleAmbientBar() {
  if (!musicWanted || typeof document !== "undefined" && document.visibilityState === "hidden") {
    stopMusicLoop();
    return;
  }
  const audio = getContext();
  if (!audio || (audio.state as string) !== "running") {
    musicRunning = false;
    return;
  }

  const bus = ensureMusicBus(audio);
  const now = audio.currentTime + 0.05;
  const barDuration = 6.0;
  const chord = AMBIENT_CHORDS[musicChordIndex % AMBIENT_CHORDS.length];
  const melody = AMBIENT_MELODY[musicChordIndex % AMBIENT_MELODY.length];
  musicChordIndex = (musicChordIndex + 1) % AMBIENT_CHORDS.length;

  // Тёплый мягкий пэд аккорда
  chord.forEach((freq, idx) => {
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1.5) * 3.5, now);

      const peak = idx === 0 ? 0.18 : 0.12;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 2.1);
      gain.gain.setValueAtTime(peak, now + barDuration - 2.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + barDuration + 0.6);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(now);
      osc.stop(now + barDuration + 0.7);
    } catch {
      // ignore
    }
  });

  // Редкие нежные колокольчиковые/арфовые ноты поверх пэда
  melody.forEach((freq, i) => {
    try {
      const start = now + 0.9 + i * 1.75;
      const dur = 2.4;
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    } catch {
      // ignore
    }
  });

  musicTimer = window.setTimeout(scheduleAmbientBar, barDuration * 1000 - 150);
}

function startMusicLoopIfReady() {
  if (!musicWanted || musicRunning) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const audio = getContext();
  if (!audio || (audio.state as string) !== "running") return;

  if (musicMasterGain) {
    try {
      musicMasterGain.gain.cancelScheduledValues(audio.currentTime);
      musicMasterGain.gain.setValueAtTime(
        Math.max(0.0001, musicMasterGain.gain.value),
        audio.currentTime
      );
      musicMasterGain.gain.linearRampToValueAtTime(0.045, audio.currentTime + 0.8);
    } catch {
      // ignore
    }
  }

  musicRunning = true;
  scheduleAmbientBar();
}

function stopMusicLoop() {
  musicRunning = false;
  if (musicTimer !== null) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (context && musicMasterGain) {
    try {
      const now = context.currentTime;
      musicMasterGain.gain.cancelScheduledValues(now);
      musicMasterGain.gain.setValueAtTime(
        Math.max(0.0001, musicMasterGain.gain.value),
        now
      );
      musicMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    } catch {
      // ignore
    }
  }
}

export function setBackgroundMusic(enabled: boolean) {
  musicWanted = enabled;
  installAudioUnlockListeners();
  if (!enabled) {
    stopMusicLoop();
    return;
  }
  const audio = getContext();
  if (!audio) return;
  if ((audio.state as string) === "running") {
    startMusicLoopIfReady();
  } else {
    void audio
      .resume()
      .then(() => {
        unlocked = true;
        startMusicLoopIfReady();
      })
      .catch(() => {});
  }
}

/**
 * На iOS 16.4+ переводит аудиосессию из режима звонка ("ambient", который
 * глушится боковым рычажком беззвучного режима на iPhone) в медиа-режим ("playback").
 */
function configureIosAudioSession() {
  if (typeof navigator === "undefined") return;
  try {
    const nav = navigator as Navigator & {
      audioSession?: { type?: string };
    };
    if (nav.audioSession && nav.audioSession.type !== "playback") {
      nav.audioSession.type = "playback";
    }
  } catch {
    // Свойство поддерживается не во всех браузерах
  }
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  configureIosAudioSession();
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  return context;
}

/**
 * Генерирует компактный 16-битный WAV data-URI для HTML5 <audio>.
 * На iPhone HTML5 <audio> играет через медиа-канал (даже при включённом
 * рычажке Silent Mode и пока WebAudio ещё выходит из suspended).
 */
function buildWavDataUri(kind: SoundKind): string {
  const cached = wavCache[kind];
  if (cached) return cached;

  const sampleRate = 22050;
  const notes = NOTES[kind];
  const totalSec =
    Math.max(...notes.map((n) => (n.delay ?? 0) + n.duration)) + 0.04;
  const numSamples = Math.max(1, Math.ceil(sampleRate * totalSec));
  const samples = new Float32Array(numSamples);

  for (const note of notes) {
    const startSample = Math.floor((note.delay ?? 0) * sampleRate);
    const durSamples = Math.floor(note.duration * sampleRate);
    const peak = note.gain ?? 0.2;
    let phase = 0;

    for (let i = 0; i < durSamples && startSample + i < numSamples; i++) {
      const progress = i / durSamples;
      const freq = note.endFreq
        ? note.freq + (note.endFreq - note.freq) * progress
        : note.freq;
      phase += (2 * Math.PI * freq) / sampleRate;

      // Огибающая с мягкой атакой и затуханием без щелчков
      const attack = Math.min(1, i / (sampleRate * 0.008));
      const release = Math.pow(1 - progress, 1.45);
      const env = attack * release * peak;

      let sample = Math.sin(phase);
      if (note.type === "triangle") {
        sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
      } else if (note.type === "sawtooth") {
        sample = 2 * ((phase / (2 * Math.PI)) - Math.floor(0.5 + phase / (2 * Math.PI)));
      }
      samples[startSample + i] += sample * env;
    }
  }

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const uri = `data:audio/wav;base64,${btoa(binary)}`;
  wavCache[kind] = uri;
  return uri;
}

function playHtmlAudioFallback(kind: SoundKind) {
  if (typeof Audio === "undefined") return;
  try {
    const uri = buildWavDataUri(kind);
    const el = new Audio(uri);
    el.volume = 0.85;
    void el.play().catch(() => {
      // Игнорируем, если автоплей заблокирован браузером
    });
  } catch {
    // ignore
  }
}

/**
 * Разблокирует WebAudio на iOS Safari/WKWebView при первом касании экрана.
 */
export function unlockAudio() {
  configureIosAudioSession();
  const audio = getContext();
  if (!audio) return;

  const state = audio.state as string;
  if (state === "suspended" || state === "interrupted") {
    void audio
      .resume()
      .then(() => {
        unlocked = true;
        startMusicLoopIfReady();
      })
      .catch(() => {});
  } else if (state === "running") {
    startMusicLoopIfReady();
  }

  if (!unlocked) {
    try {
      const buffer = audio.createBuffer(1, 1, 22050);
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.connect(audio.destination);
      source.start(0);
      unlocked = true;
    } catch {
      // ignore
    }
  }
}

export function installAudioUnlockListeners() {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  const handleGesture = () => {
    unlockAudio();
  };

  window.addEventListener("touchstart", handleGesture, { passive: true, capture: true });
  window.addEventListener("touchend", handleGesture, { passive: true, capture: true });
  window.addEventListener("pointerdown", handleGesture, { passive: true, capture: true });
  window.addEventListener("mousedown", handleGesture, { passive: true, capture: true });
  window.addEventListener("keydown", handleGesture, { passive: true, capture: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && context) {
      const state = context.state as string;
      if (state === "suspended" || state === "interrupted") {
        void context
          .resume()
          .then(() => {
            startMusicLoopIfReady();
          })
          .catch(() => {});
      } else if (state === "running") {
        startMusicLoopIfReady();
      }
    } else if (document.visibilityState === "hidden") {
      stopMusicLoop();
    }
  });
}

function scheduleNotes(audio: AudioContext, kind: SoundKind) {
  const baseTime = Math.max(audio.currentTime, 0) + 0.005;
  NOTES[kind].forEach((note) => {
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = baseTime + (note.delay ?? 0);
      const peak = note.gain ?? 0.2;

      oscillator.type = note.type ?? "sine";
      oscillator.frequency.setValueAtTime(note.freq, start);
      if (note.endFreq) {
        oscillator.frequency.exponentialRampToValueAtTime(
          note.endFreq,
          start + note.duration
        );
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + note.duration + 0.02);
    } catch {
      // ignore
    }
  });
}

export function playSound(kind: SoundKind, enabled: boolean) {
  if (!enabled) return;
  installAudioUnlockListeners();
  configureIosAudioSession();

  const audio = getContext();
  if (!audio) {
    playHtmlAudioFallback(kind);
    return;
  }

  const state = audio.state as string;
  if (state !== "running") {
    // Пока AudioContext просыпается на iOS, сразу играем через HTML5 <audio>,
    // чтобы не пропал звук первого нажатия.
    playHtmlAudioFallback(kind);
    void audio
      .resume()
      .then(() => {
        unlocked = true;
        startMusicLoopIfReady();
      })
      .catch(() => {});
    return;
  }

  startMusicLoopIfReady();
  scheduleNotes(audio, kind);
}
