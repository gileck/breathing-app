import type { Exercise, Pattern, Phase } from './types';
import { PHASES } from './types';

export const totalSeconds = (pattern: Pattern): number =>
    pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

export const breathsPerMinute = (pattern: Pattern, pace = 1): string => {
    const base = totalSeconds(pattern);
    if (base <= 0 || pace <= 0) return '—';
    return (60 / (base / pace)).toFixed(1);
};

export const patternString = (pattern: Pattern, sep = '–'): string =>
    `${pattern.inhale}${sep}${pattern.holdIn}${sep}${pattern.exhale}${sep}${pattern.holdOut}`;

export const effectiveSeconds = (pattern: Pattern, pace: number, phase: Phase): number => {
    if (pace <= 0) return 0;
    return pattern[phase] / pace;
};

export const isPatternValid = (pattern: Pattern): boolean =>
    totalSeconds(pattern) > 0 && PHASES.every((p) => pattern[p] >= 0);

export const clampPhaseValue = (value: number): number =>
    Math.max(0, Math.min(30, Math.round(value)));

export const formatLastUsed = (iso?: string, now = new Date()): string => {
    if (!iso) return 'Never';
    const then = new Date(iso);
    const diffMs = now.getTime() - then.getTime();
    const day = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor(diffMs / day);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return 'Last week';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

export const sortByLastUsed = (a: Exercise, b: Exercise): number => {
    const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return tb - ta;
};
