export type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export const PHASES: readonly Phase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const;

/** Matches the `--phase-*` CSS vars declared in src/client/styles/project.css. */
export const PHASE_COLOR_VAR: Record<Phase, string> = {
    inhale: 'var(--phase-inhale)',
    holdIn: 'var(--phase-hold-in)',
    exhale: 'var(--phase-exhale)',
    holdOut: 'var(--phase-hold-out)',
};

export type Pattern = {
    inhale: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
};

export type SessionLength =
    | { kind: 'minutes'; value: number }
    | { kind: 'cycles'; value: number }
    | { kind: 'open' };

export type Exercise = {
    id: string;
    name: string;
    pattern: Pattern;
    pace: number;
    length: SessionLength;
    favorite: boolean;
    /** If true, a short meditation voice-over plays before the countdown. */
    meditation?: boolean;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt: string;
};
