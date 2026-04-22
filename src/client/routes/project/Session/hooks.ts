import { useCallback, useEffect, useRef, useState } from 'react';
import {
    advance,
    complete,
    createInitialState,
    nudgeActivePhase,
    pause,
    queuePace,
    resume,
    start,
    type EngineState,
} from '@/client/features/project/breath-engine';
import type { Exercise } from '@/client/features/project/exercises';
import {
    playPhaseCue,
    playVoiceCue,
    setMasterVolume,
    useAudioSettingsStore,
} from '@/client/features/project/breathing-audio';

export type EngineHandle = {
    state: EngineState;
    beginSession: () => void;
    togglePause: () => void;
    stop: () => void;
    setPendingPace: (pace: number) => void;
    nudgePhase: (delta: number) => void;
    isComplete: boolean;
    isIdle: boolean;
};

const sessionTargetMs = (exercise: Exercise): number | null => {
    if (exercise.length.kind === 'minutes') return exercise.length.value * 60 * 1000;
    return null;
};

const sessionTargetCycles = (exercise: Exercise): number | null => {
    if (exercise.length.kind === 'cycles') return exercise.length.value;
    return null;
};

export function useBreathSession(exercise: Exercise): EngineHandle {
    // eslint-disable-next-line state-management/prefer-state-architecture -- per-session engine state is ephemeral to this route instance
    const [state, setState] = useState<EngineState>(() =>
        // Pace is a runtime-only knob — sessions always start at 1× and the
        // user tweaks it mid-session with the Fast / Slow buttons.
        createInitialState(exercise.pattern, 1),
    );
    const stateRef = useRef(state);
    stateRef.current = state;

    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);

    // rAF only spins while the engine is actively advancing. While idle
    // (pre-session meditation + countdown) or paused / complete we let the
    // browser sleep — otherwise ~30 s of idle time burns ~1,800 no-op frames.
    useEffect(() => {
        if (state.status !== 'running') return;

        const tick = (now: number) => {
            const last = lastTickRef.current ?? now;
            const delta = now - last;
            lastTickRef.current = now;

            const current = stateRef.current;
            const result = advance(current, delta);
            let nextState = result.state;

            if (result.phaseChanged) {
                const audio = useAudioSettingsStore.getState();
                if (audio.enabled && audio.cues[nextState.phase]) {
                    if (audio.voice) {
                        playVoiceCue(nextState.phase);
                    } else if (audio.style !== 'silent') {
                        playPhaseCue(nextState.phase, audio.style);
                    }
                }
            }

            const targetMs = sessionTargetMs(exercise);
            const targetCycles = sessionTargetCycles(exercise);
            const reachedTime = targetMs !== null && nextState.totalElapsedMs >= targetMs;
            const reachedCycles = targetCycles !== null && nextState.cycle >= targetCycles;
            if (reachedTime || reachedCycles) {
                nextState = complete(nextState);
            }

            setState(nextState);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            // Reset so a subsequent resume doesn't attribute the pause gap
            // to the first frame's delta.
            lastTickRef.current = null;
        };
    }, [exercise, state.status]);

    // Keep the master gain in sync with the persisted volume setting,
    // even if the user changes it in another tab or mid-session.
    useEffect(() => {
        setMasterVolume(useAudioSettingsStore.getState().volume);
        return useAudioSettingsStore.subscribe(
            (s) => s.volume,
            (volume) => setMasterVolume(volume),
        );
    }, []);

    const beginSession = useCallback(() => {
        const current = stateRef.current;
        if (current.status !== 'idle') return;
        const audio = useAudioSettingsStore.getState();
        if (audio.enabled && audio.cues[current.phase]) {
            if (audio.voice) playVoiceCue(current.phase);
            else if (audio.style !== 'silent') playPhaseCue(current.phase, audio.style);
        }
        setState((prev) => (prev.status === 'idle' ? start(prev) : prev));
    }, []);

    const togglePause = useCallback(() => {
        setState((prev) => (prev.status === 'running' ? pause(prev) : resume(prev)));
    }, []);

    const stop = useCallback(() => {
        setState((prev) => complete(prev));
    }, []);

    const setPendingPace = useCallback((pace: number) => {
        setState((prev) => queuePace(prev, pace));
    }, []);

    const nudgePhase = useCallback((delta: number) => {
        setState((prev) => nudgeActivePhase(prev, delta));
    }, []);

    return {
        state,
        beginSession,
        togglePause,
        stop,
        setPendingPace,
        nudgePhase,
        isComplete: state.status === 'complete',
        isIdle: state.status === 'idle',
    };
}

export const formatElapsed = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
