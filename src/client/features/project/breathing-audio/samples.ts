import type { Phase } from '@/client/features/project/exercises';

export type SampleId =
    | 'gong'
    | 'bowl'
    | 'voice-inhale'
    | 'voice-hold'
    | 'voice-exhale'
    | 'voice-starting'
    | 'voice-meditation';

type SampleConfig = {
    url: string;
    /** Per-phase playback rate. Shifts pitch + duration for variety. */
    playbackRates: Record<Phase, number>;
    /** 0–1 gain multiplier applied on top of the master volume. */
    gain: number;
};

const FLAT_RATES: Record<Phase, number> = {
    inhale: 1,
    holdIn: 1,
    exhale: 1,
    holdOut: 1,
};

const SAMPLES: Record<SampleId, SampleConfig> = {
    gong: {
        url: '/audio/gong.ogg',
        playbackRates: { inhale: 1.15, holdIn: 1.3, exhale: 0.85, holdOut: 0.75 },
        gain: 0.9,
    },
    bowl: {
        url: '/audio/bowl.ogg',
        playbackRates: { inhale: 1.1, holdIn: 1.2, exhale: 0.9, holdOut: 0.8 },
        gain: 0.85,
    },
    // Voice samples keep a flat rate: pitch-shifting speech sounds unnatural.
    'voice-inhale': {
        url: '/audio/voice/inhale.ogg',
        playbackRates: FLAT_RATES,
        gain: 1,
    },
    'voice-hold': {
        url: '/audio/voice/hold.ogg',
        playbackRates: FLAT_RATES,
        gain: 1,
    },
    'voice-exhale': {
        url: '/audio/voice/exhale.ogg',
        playbackRates: FLAT_RATES,
        gain: 1,
    },
    'voice-starting': {
        url: '/audio/voice/starting.ogg',
        playbackRates: FLAT_RATES,
        gain: 1,
    },
    'voice-meditation': {
        url: '/audio/voice/meditation.ogg',
        playbackRates: FLAT_RATES,
        gain: 1,
    },
};

export const VOICE_SAMPLE_IDS: readonly SampleId[] = [
    'voice-inhale',
    'voice-hold',
    'voice-exhale',
];

export const voiceSampleForPhase = (phase: Phase): SampleId => {
    switch (phase) {
        case 'inhale':
            return 'voice-inhale';
        case 'exhale':
            return 'voice-exhale';
        case 'holdIn':
        case 'holdOut':
        default:
            return 'voice-hold';
    }
};

type SampleStatus = 'idle' | 'loading' | 'loaded' | 'missing';

type SampleEntry = {
    status: SampleStatus;
    buffer: AudioBuffer | null;
    promise: Promise<AudioBuffer | null> | null;
};

const cache: Record<SampleId, SampleEntry> = {
    gong: { status: 'idle', buffer: null, promise: null },
    bowl: { status: 'idle', buffer: null, promise: null },
    'voice-inhale': { status: 'idle', buffer: null, promise: null },
    'voice-hold': { status: 'idle', buffer: null, promise: null },
    'voice-exhale': { status: 'idle', buffer: null, promise: null },
    'voice-starting': { status: 'idle', buffer: null, promise: null },
    'voice-meditation': { status: 'idle', buffer: null, promise: null },
};

export const getSampleBuffer = (id: SampleId): AudioBuffer | null =>
    cache[id].buffer;

// Active sample sources — kept so we can cut them off when the user bails
// out of a session before long-running cues (meditation, starting) finish.
const activeSources = new Set<AudioScheduledSourceNode>();

export const stopAllSamples = (): void => {
    // Snapshot first: stopping a source synchronously schedules `onended`,
    // which mutates `activeSources`. Iterating the live Set would skip nodes.
    const snapshot = Array.from(activeSources);
    activeSources.clear();
    for (const source of snapshot) {
        try {
            source.stop();
        } catch {
            /* already stopped */
        }
        try {
            source.disconnect();
        } catch {
            /* already disconnected */
        }
    }
};

export const getSampleStatus = (id: SampleId): SampleStatus => cache[id].status;

export const loadSample = (
    ctx: AudioContext,
    id: SampleId,
): Promise<AudioBuffer | null> => {
    const entry = cache[id];
    if (entry.status === 'loaded' && entry.buffer) return Promise.resolve(entry.buffer);
    if (entry.promise) return entry.promise;

    const cfg = SAMPLES[id];
    entry.status = 'loading';
    entry.promise = (async () => {
        try {
            const res = await fetch(cfg.url);
            if (!res.ok) throw new Error(`sample fetch failed: ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arrayBuffer);
            entry.buffer = decoded;
            entry.status = 'loaded';
            return decoded;
        } catch {
            entry.status = 'missing';
            entry.buffer = null;
            return null;
        } finally {
            entry.promise = null;
        }
    })();
    return entry.promise;
};

/**
 * Fire-and-forget: play the sample if already loaded, otherwise kick off
 * a load so the next trigger hits the cache. Returns true when audio
 * started immediately, false when the sample wasn't ready yet.
 */
export const playSample = (
    ctx: AudioContext,
    bus: GainNode,
    id: SampleId,
    phase: Phase,
): boolean => {
    const entry = cache[id];
    if (entry.status !== 'loaded' || !entry.buffer) {
        void loadSample(ctx, id);
        return false;
    }

    const cfg = SAMPLES[id];
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = entry.buffer;
    source.playbackRate.setValueAtTime(cfg.playbackRates[phase], ctx.currentTime);
    gain.gain.setValueAtTime(cfg.gain, ctx.currentTime);
    source.connect(gain).connect(bus);
    activeSources.add(source);
    source.start(ctx.currentTime);
    source.onended = () => {
        activeSources.delete(source);
        try {
            source.disconnect();
            gain.disconnect();
        } catch {
            /* already disconnected */
        }
    };
    return true;
};
