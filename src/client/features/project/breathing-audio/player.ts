import type { Phase } from '@/client/features/project/exercises';
import type { AudioCueStyle } from './types';

type WebkitWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const resolveAudioContextCtor = (): typeof AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const w = window as WebkitWindow;
    return window.AudioContext ?? w.webkitAudioContext ?? null;
};

export const isAudioReady = (): boolean => ctx !== null && ctx.state === 'running';

export const ensureAudio = async (): Promise<boolean> => {
    const Ctor = resolveAudioContextCtor();
    if (!Ctor) return false;
    if (!ctx) {
        try {
            ctx = new Ctor();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.3;
            masterGain.connect(ctx.destination);
        } catch {
            ctx = null;
            masterGain = null;
            return false;
        }
    }
    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch {
            return false;
        }
    }
    return ctx.state === 'running';
};

export const setMasterVolume = (volume: number): void => {
    if (!ctx || !masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    masterGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.03);
};

export const suspendAudio = async (): Promise<void> => {
    if (ctx?.state === 'running') {
        try {
            await ctx.suspend();
        } catch {
            // ignore
        }
    }
};

// ─────────────────────────────────────────────────────────────
// Per-phase pitch arcs (shared across styles)
// ─────────────────────────────────────────────────────────────
type PitchArc = { startHz: number; endHz: number };

const PHASE_PITCH: Record<Phase, PitchArc> = {
    inhale: { startHz: 220, endHz: 330 },
    holdIn: { startHz: 440, endHz: 440 },
    exhale: { startHz: 330, endHz: 165 },
    holdOut: { startHz: 293, endHz: 293 },
};

type PhaseTiming = { duration: number; peak: number };

const LONG_PHASE: PhaseTiming = { duration: 0.8, peak: 0.7 };
const SHORT_PHASE: PhaseTiming = { duration: 0.2, peak: 0.4 };

const PHASE_TIMING: Record<Phase, PhaseTiming> = {
    inhale: LONG_PHASE,
    holdIn: SHORT_PHASE,
    exhale: { duration: 0.95, peak: 0.7 },
    holdOut: SHORT_PHASE,
};

// Oscillators/buffers are kept reachable until onended fires, then disconnected
// so downstream GC can reclaim the nodes — stop() alone doesn't disconnect.
const disposeOnEnd = (source: AudioScheduledSourceNode, chain: AudioNode[]): void => {
    source.onended = () => {
        for (const node of chain) {
            try { node.disconnect(); } catch { /* already disconnected */ }
        }
    };
};

// ─────────────────────────────────────────────────────────────
// Style: tones — gliding sine tones
// ─────────────────────────────────────────────────────────────
function playTones(audioCtx: AudioContext, bus: GainNode, phase: Phase): void {
    const pitch = PHASE_PITCH[phase];
    const timing = PHASE_TIMING[phase];
    const now = audioCtx.currentTime;
    const release = 0.25;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch.startHz, now);
    if (pitch.endHz !== pitch.startHz) {
        osc.frequency.linearRampToValueAtTime(pitch.endHz, now + timing.duration);
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(timing.peak, now + 0.04);
    gain.gain.linearRampToValueAtTime(0, now + timing.duration + release);
    osc.connect(gain).connect(bus);
    osc.start(now);
    osc.stop(now + timing.duration + release + 0.02);
    disposeOnEnd(osc, [osc, gain]);
}

// ─────────────────────────────────────────────────────────────
// Style: chime — bell-like harmonic stack, exponential decay
// ─────────────────────────────────────────────────────────────
function playChime(audioCtx: AudioContext, bus: GainNode, phase: Phase): void {
    const pitch = PHASE_PITCH[phase];
    const timing = PHASE_TIMING[phase];
    const now = audioCtx.currentTime;
    const decay = Math.max(0.7, timing.duration + 0.4);

    const harmonics = [
        { mult: 1, level: 1.0 },
        { mult: 2.01, level: 0.45 },
        { mult: 3.02, level: 0.2 },
    ];

    for (const { mult, level } of harmonics) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch.startHz * mult, now);
        if (pitch.endHz !== pitch.startHz) {
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(10, pitch.endHz * mult),
                now + timing.duration,
            );
        }
        const peak = timing.peak * level * 0.9;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        osc.connect(gain).connect(bus);
        osc.start(now);
        osc.stop(now + decay + 0.02);
        disposeOnEnd(osc, [osc, gain]);
    }
}

// ─────────────────────────────────────────────────────────────
// Style: pulse — low-pass filtered triangle, gentle swell
// ─────────────────────────────────────────────────────────────
function playPulse(audioCtx: AudioContext, bus: GainNode, phase: Phase): void {
    const pitch = PHASE_PITCH[phase];
    const timing = PHASE_TIMING[phase];
    const now = audioCtx.currentTime;
    const attack = Math.min(0.25, timing.duration * 0.35);
    const release = Math.max(0.35, timing.duration * 0.5);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch.startHz, now);
    if (pitch.endHz !== pitch.startHz) {
        osc.frequency.linearRampToValueAtTime(pitch.endHz, now + timing.duration);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(0.6, now);

    const peak = timing.peak * 0.85;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.linearRampToValueAtTime(0, now + timing.duration + release);

    osc.connect(filter).connect(gain).connect(bus);
    osc.start(now);
    osc.stop(now + timing.duration + release + 0.02);
    disposeOnEnd(osc, [osc, filter, gain]);
}

// ─────────────────────────────────────────────────────────────
// Style: click — short woodblock (pitched click + high noise)
// ─────────────────────────────────────────────────────────────
function playClick(audioCtx: AudioContext, bus: GainNode, phase: Phase): void {
    const now = audioCtx.currentTime;
    const duration = 0.12;

    // Pitched body — fast pitch-drop sine
    const clickPitch: Record<Phase, number> = {
        inhale: 550,
        holdIn: 720,
        exhale: 320,
        holdOut: 220,
    };
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(clickPitch[phase], now);
    osc.frequency.exponentialRampToValueAtTime(
        Math.max(10, clickPitch[phase] * 0.4),
        now + duration,
    );
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(oscGain).connect(bus);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    disposeOnEnd(osc, [osc, oscGain]);

    // Short filtered noise transient for percussive edge
    const noiseDuration = 0.035;
    const frameCount = Math.floor(audioCtx.sampleRate * noiseDuration);
    const buffer = audioCtx.createBuffer(1, frameCount, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    const noiseFilter = audioCtx.createBiquadFilter();
    const noiseGain = audioCtx.createGain();
    noise.buffer = buffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);
    noise.connect(noiseFilter).connect(noiseGain).connect(bus);
    noise.start(now);
    noise.stop(now + noiseDuration);
    disposeOnEnd(noise, [noise, noiseFilter, noiseGain]);
}

// ─────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────
export const playPhaseCue = (phase: Phase, style: AudioCueStyle = 'tones'): void => {
    if (!ctx || !masterGain || ctx.state !== 'running') return;
    if (style === 'silent') return;
    switch (style) {
        case 'tones':
            playTones(ctx, masterGain, phase);
            return;
        case 'chime':
            playChime(ctx, masterGain, phase);
            return;
        case 'pulse':
            playPulse(ctx, masterGain, phase);
            return;
        case 'click':
            playClick(ctx, masterGain, phase);
            return;
        default:
            return;
    }
};
