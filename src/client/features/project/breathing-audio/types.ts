import type { Phase } from '@/client/features/project/exercises';

export type AudioCueStyle = 'tones' | 'chime' | 'pulse' | 'click' | 'silent';

export const AUDIO_CUE_STYLES: Array<{
    value: AudioCueStyle;
    label: string;
    description: string;
}> = [
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
};

export const DEFAULT_PHASE_CUES: PhaseCues = {
    inhale: true,
    holdIn: true,
    exhale: true,
    holdOut: true,
};
