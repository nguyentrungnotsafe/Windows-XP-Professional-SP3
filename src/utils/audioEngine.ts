import type { AudioState, ModalPromptRequest } from '../types/os';

export type XpSystemSoundId = 'startup' | 'logon' | 'logoff' | 'shutdown' | 'error';

export type SoundPlayResult = 'played' | 'blocked' | 'muted' | 'unavailable';

export interface XpSystemSoundMeta {
  id: XpSystemSoundId;
  label: string;
  fileName: string;
  url: string;
  description: string;
}

export const XP_SYSTEM_SOUNDS: XpSystemSoundMeta[] = [
  {
    id: 'startup',
    label: 'Start Windows',
    fileName: 'windows-xp-startup.wav',
    url: '/assets/aistudio/windows-xp-startup_85e726b5.wav',
    description: 'Plays when Windows XP starts.',
  },
  {
    id: 'logon',
    label: 'Windows Logon',
    fileName: 'windows-xp-logon.wav',
    url: '/assets/aistudio/windows-xp-logon_53ec1fe4.wav',
    description: 'Plays when logging on to a user account.',
  },
  {
    id: 'logoff',
    label: 'Windows Logoff',
    fileName: 'windows-xp-logoff.wav',
    url: '/assets/aistudio/windows-xp-logoff_79a52ef4.wav',
    description: 'Plays when logging off Windows.',
  },
  {
    id: 'shutdown',
    label: 'Exit Windows',
    fileName: 'windows-xp-shutdown.wav',
    url: '/assets/aistudio/windows-xp-shutdown_d97704cd.wav',
    description: 'Plays when turning off the computer.',
  },
  {
    id: 'error',
    label: 'Critical Stop',
    fileName: 'windows-xp-error.wav',
    url: '/assets/aistudio/windows-xp-error_3e7ff4bc.wav',
    description: 'Plays when an error or warning dialog appears.',
  },
];

export const XP_SYSTEM_SOUND_MAP: Record<XpSystemSoundId, XpSystemSoundMeta> =
  XP_SYSTEM_SOUNDS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<XpSystemSoundId, XpSystemSoundMeta>
  );

export function getModalSoundForIcon(
  icon?: ModalPromptRequest['icon']
): XpSystemSoundId | null {
  if (icon === 'error' || icon === 'warning') {
    return 'error';
  }
  return null;
}

export type SessionSoundTransition = 'power_on' | 'log_on' | 'log_off' | 'shut_down';

export function getSessionTransitionSound(
  transition: SessionSoundTransition
): XpSystemSoundId {
  switch (transition) {
    case 'power_on':
      return 'startup';
    case 'log_on':
      return 'logon';
    case 'log_off':
      return 'logoff';
    case 'shut_down':
      return 'shutdown';
  }
}

// Shared Web Audio engine wired to global Volume Control state (Master Volume, Wave Volume, Mute, Balance)
class XpAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private currentState: AudioState = {
    masterVolume: 80,
    waveVolume: 80,
    synthVolume: 80,
    muted: false,
    balance: 0,
  };
  private timerIds: number[] = [];
  private activeNodes: AudioNode[] = [];

  private rawBufferCache = new Map<XpSystemSoundId, ArrayBuffer>();
  private pendingFetch = new Map<XpSystemSoundId, Promise<ArrayBuffer | null>>();
  private decodedBufferCache = new Map<XpSystemSoundId, AudioBuffer>();
  private activeSystemSource: {
    id: XpSystemSoundId;
    stop: () => void;
  } | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private activeSystemSoundId: XpSystemSoundId | null = null;
  private playSequence = 0;
  private playbackListeners = new Set<(playingId: XpSystemSoundId | null) => void>();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      if (typeof this.ctx.createStereoPanner === 'function') {
        this.panner = this.ctx.createStereoPanner();
        this.masterGain.connect(this.panner);
        this.panner.connect(this.ctx.destination);
      } else {
        this.masterGain.connect(this.ctx.destination);
      }
      this.applyState(this.currentState);
    }
    return this.ctx;
  }

  private notifyPlaybackListeners() {
    for (const listener of this.playbackListeners) {
      listener(this.activeSystemSoundId);
    }
  }

  public onPlaybackChange(listener: (playingId: XpSystemSoundId | null) => void): () => void {
    this.playbackListeners.add(listener);
    listener(this.activeSystemSoundId);
    return () => {
      this.playbackListeners.delete(listener);
    };
  }

  public getPlayingSystemSound(): XpSystemSoundId | null {
    return this.activeSystemSoundId;
  }

  public applyState(state: AudioState) {
    this.currentState = state;
    if (this.masterGain && this.ctx) {
      const gainVal = state.muted
        ? 0
        : Math.max(0, Math.min(1, (state.masterVolume / 100) * (state.waveVolume / 100)));
      this.masterGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.02);
    }
    if (this.panner && this.ctx) {
      this.panner.pan.setTargetAtTime(
        Math.max(-1, Math.min(1, state.balance)),
        this.ctx.currentTime,
        0.02
      );
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.volume = this.getEffectiveGain();
      this.activeHtmlAudio.muted = state.muted;
    }
  }

  public getEffectiveGain(): number {
    if (this.currentState.muted) return 0;
    return Math.max(
      0,
      Math.min(1, (this.currentState.masterVolume / 100) * (this.currentState.waveVolume / 100))
    );
  }

  public stopSystemSound() {
    this.playSequence += 1;
    if (this.activeSystemSource) {
      try {
        this.activeSystemSource.stop();
      } catch {
        // ignore stopped buffer source
      }
      this.activeSystemSource = null;
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {
        // ignore audio teardown errors
      }
      this.activeHtmlAudio = null;
    }
    if (this.activeSystemSoundId !== null) {
      this.activeSystemSoundId = null;
      this.notifyPlaybackListeners();
    }
  }

  public stopAll() {
    for (const id of this.timerIds) {
      window.clearTimeout(id);
    }
    this.timerIds = [];
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore stopped nodes
      }
    }
    this.activeNodes = [];
    this.stopSystemSound();
  }

  private async fetchRawAudio(id: XpSystemSoundId): Promise<ArrayBuffer | null> {
    const cached = this.rawBufferCache.get(id);
    if (cached) return cached;

    const existingPromise = this.pendingFetch.get(id);
    if (existingPromise) return existingPromise;

    const meta = XP_SYSTEM_SOUND_MAP[id];
    if (!meta || typeof fetch !== 'function') return null;

    const promise = fetch(meta.url)
      .then(async (res) => {
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        this.rawBufferCache.set(id, buf);
        return buf;
      })
      .catch(() => null)
      .finally(() => {
        this.pendingFetch.delete(id);
      });

    this.pendingFetch.set(id, promise);
    return promise;
  }

  private async getDecodedBuffer(
    id: XpSystemSoundId,
    ctx: AudioContext
  ): Promise<AudioBuffer | null> {
    const cached = this.decodedBufferCache.get(id);
    if (cached) return cached;

    const raw = await this.fetchRawAudio(id);
    if (!raw) return null;

    try {
      // Clone ArrayBuffer so decodeAudioData detaching does not invalidate cached bytes
      const decoded = await ctx.decodeAudioData(raw.slice(0));
      this.decodedBufferCache.set(id, decoded);
      return decoded;
    } catch {
      return null;
    }
  }

  public preloadSystemSounds() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;
    for (const sound of XP_SYSTEM_SOUNDS) {
      void this.fetchRawAudio(sound.id);
    }
  }

  private async playWithHtmlAudio(
    id: XpSystemSoundId,
    seq: number,
    allowBlockedReturn: boolean
  ): Promise<SoundPlayResult> {
    if (typeof Audio === 'undefined') return 'unavailable';
    const meta = XP_SYSTEM_SOUND_MAP[id];
    if (!meta) return 'unavailable';

    try {
      const el = new Audio(meta.url);
      el.volume = this.getEffectiveGain();
      el.muted = this.currentState.muted;
      this.activeHtmlAudio = el;
      this.activeSystemSoundId = id;
      this.notifyPlaybackListeners();

      const cleanup = () => {
        if (this.activeHtmlAudio === el) {
          this.activeHtmlAudio = null;
        }
        if (this.playSequence === seq && this.activeSystemSoundId === id) {
          this.activeSystemSoundId = null;
          this.notifyPlaybackListeners();
        }
      };
      el.onended = cleanup;
      el.onerror = cleanup;

      await el.play();
      if (this.playSequence !== seq) {
        el.pause();
        return 'played';
      }
      return 'played';
    } catch (err) {
      if (this.activeHtmlAudio) {
        this.activeHtmlAudio = null;
      }
      if (this.playSequence === seq && this.activeSystemSoundId === id) {
        this.activeSystemSoundId = null;
        this.notifyPlaybackListeners();
      }
      if (
        allowBlockedReturn ||
        (err instanceof DOMException && err.name === 'NotAllowedError')
      ) {
        return 'blocked';
      }
      return 'unavailable';
    }
  }

  public async playSystemSound(
    id: XpSystemSoundId,
    options?: { interrupt?: boolean; allowBlockedReturn?: boolean }
  ): Promise<SoundPlayResult> {
    if (typeof window === 'undefined') return 'unavailable';
    if (this.getEffectiveGain() <= 0) return 'muted';

    const interrupt = options?.interrupt ?? true;
    const allowBlockedReturn = options?.allowBlockedReturn ?? false;

    if (interrupt) {
      this.stopSystemSound();
    }
    const seq = ++this.playSequence;

    const ctx = this.ensureContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // autoplay blocked before user interaction
        }
      }

      if (this.playSequence !== seq) return 'played';
      if (this.getEffectiveGain() <= 0) return 'muted';

      if (ctx.state === 'running' && this.masterGain) {
        const buffer = await this.getDecodedBuffer(id, ctx);
        if (this.playSequence !== seq) return 'played';
        if (this.getEffectiveGain() <= 0) return 'muted';

        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.masterGain);

          this.activeSystemSource = {
            id,
            stop: () => {
              try {
                source.stop();
              } catch {
                // ignore already stopped
              }
              try {
                source.disconnect();
              } catch {
                // ignore disconnected
              }
            },
          };
          this.activeSystemSoundId = id;
          this.notifyPlaybackListeners();

          source.onended = () => {
            try {
              source.disconnect();
            } catch {
              // ignore
            }
            if (this.playSequence === seq) {
              this.activeSystemSource = null;
              this.activeSystemSoundId = null;
              this.notifyPlaybackListeners();
            }
          };

          source.start(0);
          return 'played';
        }
      } else if (allowBlockedReturn) {
        return 'blocked';
      }
    }

    if (allowBlockedReturn) {
      return 'blocked';
    }
    return this.playWithHtmlAudio(id, seq, allowBlockedReturn);
  }

  public playTone(
    freq: number,
    durationMs: number,
    type: OscillatorType = 'triangle',
    gainScale = 0.25
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(gainScale, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
    this.activeNodes.push(osc);
  }

  public playXpStartupChime() {
    void this.playSystemSound('startup');
  }

  public playMelodyStep(preset: string, stepIndex: number) {
    const melodies: Record<string, number[]> = {
      beethoven: [392, 392, 392, 311.13, 349.23, 349.23, 349.23, 293.66, 392, 440, 493.88, 523.25],
      xp_title: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99, 659.25, 523.25],
      breeze: [440, 493.88, 554.37, 659.25, 587.33, 493.88, 440, 392, 440, 554.37],
    };
    const seq = melodies[preset] ?? melodies.xp_title;
    const freq = seq[stepIndex % seq.length];
    this.playTone(freq, 420, 'triangle', 0.2);
  }
}

export const xpAudio = new XpAudioController();
