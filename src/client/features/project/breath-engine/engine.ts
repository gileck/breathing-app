import { PHASES, type Pattern, type Phase } from '@/client/features/project/exercises';
import type { EngineState, EngineTransition } from './types';

const phaseDurationMs = (pattern: Pattern, pace: number, phase: Phase): number => {
    if (pace <= 0) return 0;
    return Math.max(0, (pattern[phase] / pace) * 1000);
};

const firstActivePhase = (pattern: Pattern): Phase => {
    for (const p of PHASES) {
        if (pattern[p] > 0) return p;
    }
    return 'inhale';
};

const nextPhase = (pattern: Pattern, current: Phase): Phase => {
    const startIndex = PHASES.indexOf(current);
    for (let step = 1; step <= PHASES.length; step += 1) {
        const candidate = PHASES[(startIndex + step) % PHASES.length];
        if (pattern[candidate] > 0) return candidate;
    }
    return current;
};

export const createInitialState = (pattern: Pattern, pace: number): EngineState => ({
    pattern,
    pace,
    phase: firstActivePhase(pattern),
    phaseElapsedMs: 0,
    cycleElapsedMs: 0,
    cycle: 0,
    totalElapsedMs: 0,
    status: 'idle',
});

export const start = (state: EngineState): EngineState => ({
    ...state,
    status: 'running',
});

export const pause = (state: EngineState): EngineState =>
    state.status === 'running' ? { ...state, status: 'paused' } : state;

export const resume = (state: EngineState): EngineState =>
    state.status === 'paused' ? { ...state, status: 'running' } : state;

export const complete = (state: EngineState): EngineState => ({
    ...state,
    status: 'complete',
});

export const queuePattern = (state: EngineState, pattern: Pattern): EngineState => ({
    ...state,
    pendingPattern: pattern,
});

export const queuePace = (state: EngineState, pace: number): EngineState => ({
    ...state,
    pendingPace: pace,
});

export const nudgeActivePhase = (state: EngineState, delta: number): EngineState => {
    const current = state.pendingPattern ?? state.pattern;
    const next = Math.max(0, Math.min(30, current[state.phase] + delta));
    return queuePattern(state, { ...current, [state.phase]: next });
};

export const advance = (state: EngineState, deltaMs: number): EngineTransition => {
    if (state.status !== 'running' || deltaMs <= 0) {
        return { state, phaseChanged: false, cycleChanged: false };
    }

    let { phase, phaseElapsedMs, cycleElapsedMs, cycle, pattern, pace, totalElapsedMs } = state;
    let pendingPattern = state.pendingPattern;
    let pendingPace = state.pendingPace;
    let phaseChanged = false;
    let cycleChanged = false;
    let remaining = deltaMs;

    totalElapsedMs += deltaMs;

    while (remaining > 0) {
        const phaseDuration = phaseDurationMs(pattern, pace, phase);
        if (phaseDuration <= 0) {
            const next = nextPhase(pattern, phase);
            if (next === phase) break;
            phase = next;
            phaseElapsedMs = 0;
            phaseChanged = true;
            continue;
        }

        const timeLeftInPhase = phaseDuration - phaseElapsedMs;
        if (remaining < timeLeftInPhase) {
            phaseElapsedMs += remaining;
            cycleElapsedMs += remaining;
            remaining = 0;
            break;
        }

        remaining -= timeLeftInPhase;
        phaseElapsedMs = 0;
        cycleElapsedMs += timeLeftInPhase;

        const next = nextPhase(pattern, phase);
        const wrappedCycle = PHASES.indexOf(next) <= PHASES.indexOf(phase);
        phase = next;
        phaseChanged = true;

        if (wrappedCycle) {
            cycle += 1;
            cycleElapsedMs = 0;
            cycleChanged = true;
            if (pendingPattern || pendingPace !== undefined) {
                if (pendingPattern) pattern = pendingPattern;
                if (pendingPace !== undefined) pace = pendingPace;
                pendingPattern = undefined;
                pendingPace = undefined;
                phase = firstActivePhase(pattern);
            }
        }
    }

    return {
        state: {
            ...state,
            pattern,
            pace,
            phase,
            phaseElapsedMs,
            cycleElapsedMs,
            cycle,
            totalElapsedMs,
            pendingPattern,
            pendingPace,
        },
        phaseChanged,
        cycleChanged,
    };
};

export const phaseProgress = (state: EngineState): number => {
    const duration = phaseDurationMs(state.pattern, state.pace, state.phase);
    if (duration <= 0) return 0;
    return Math.min(1, state.phaseElapsedMs / duration);
};

export const phaseCountdownSeconds = (state: EngineState): number => {
    const duration = phaseDurationMs(state.pattern, state.pace, state.phase);
    if (duration <= 0) return 0;
    return Math.max(0, Math.ceil((duration - state.phaseElapsedMs) / 1000));
};

export const shapeScaleForPhase = (phase: Phase, progress: number): number => {
    const clamped = Math.min(1, Math.max(0, progress));
    const ease = (t: number): number =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    switch (phase) {
        case 'inhale':
            return 0.55 + 0.45 * ease(clamped);
        case 'exhale':
            return 1.0 - 0.45 * ease(clamped);
        case 'holdIn':
            return 1.0;
        case 'holdOut':
        default:
            return 0.55;
    }
};

export const hasPendingChanges = (state: EngineState): boolean =>
    state.pendingPattern !== undefined || state.pendingPace !== undefined;
