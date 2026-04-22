import type { Phase } from '@/client/features/project/exercises';

export type AudioCueStyle =
    | 'tones'
    | 'chime'
    | 'pulse'
    | 'click'
    | 'gong'
    | 'bowl'
    | 'silent';

export type AudioCueStyleMeta = {
    value: AudioCueStyle;
    label: string;
    description: string;
    /** Recorded samples are loaded lazily and can be missing on a fresh clone. */
    sample?: 'gong' | 'bowl';
};

export const AUDIO_CUE_STYLES: AudioCueStyleMeta[] = [
    {
        value: 'tones',
        label: 'Tones',
        description: 'Smooth sine tones that rise and fall with the breath.',
    },
    {
        value: 'chime',
        label: 'Chime',
        description: 'Bell-like harmonic tones with a gentle decay.',
    },
    {
        value: 'pulse',
        label: 'Pulse',
        description: 'Soft filtered pulse — calm and unobtrusive.',
    },
    {
        value: 'click',
        label: 'Click',
        description: 'Short percussive click at each phase transition.',
    },
    {
        value: 'gong',
        label: 'Gong',
        description: 'Resonant metal gong with a long decay. Recorded sample.',
        sample: 'gong',
    },
    {
        value: 'bowl',
        label: 'Singing bowl',
        description: 'Warm Tibetan-bowl hum. Recorded sample.',
        sample: 'bowl',
    },
    {
        value: 'silent',
        label: 'Silent',
        description: 'No sound at phase transitions.',
    },
];

export type PhaseCues = Record<Phase, boolean>;

export type AudioSettings = {
    enabled: boolean;
    volume: number;
    style: AudioCueStyle;
    cues: PhaseCues;
    /** Spoken "inhale" / "hold" / "exhale" cues layered on top of the style. */
    voice: boolean;
};

export const DEFAULT_PHASE_CUES: PhaseCues = {
    inhale: true,
    holdIn: true,
    exhale: true,
    holdOut: true,
};
