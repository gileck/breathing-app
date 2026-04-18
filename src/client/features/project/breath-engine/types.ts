import type { Pattern, Phase } from '@/client/features/project/exercises';

export type EngineState = {
    pattern: Pattern;
    pace: number;
    phase: Phase;
    phaseElapsedMs: number;
    cycleElapsedMs: number;
    cycle: number;
    totalElapsedMs: number;
    status: 'idle' | 'running' | 'paused' | 'complete';
    pendingPattern?: Pattern;
    pendingPace?: number;
};

export type EngineTransition = {
    state: EngineState;
    phaseChanged: boolean;
    cycleChanged: boolean;
};
