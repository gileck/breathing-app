import { useEffect, useRef, useState } from 'react';
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
    ensureAudio,
    playPhaseCue,
    setMasterVolume,
    useAudioSettingsStore,
} from '@/client/features/project/breathing-audio';

export type EngineHandle = {
    state: EngineState;
    togglePause: () => void;
    stop: () => void;
    setPendingPace: (pace: number) => void;
    nudgePhase: (delta: number) => void;
    isComplete: boolean;
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
        start(createInitialState(exercise.pattern, exercise.pace)),
    );
    const stateRef = useRef(state);
    stateRef.current = state;

    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);
    const hasCuedInitialPhaseRef = useRef(false);

    useEffect(() => {
        const tick = (now: number) => {
            const last = lastTickRef.current ?? now;
            const delta = now - last;
            lastTickRef.current = now;

            const current = stateRef.current;
            if (current.status !== 'running') {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const result = advance(current, delta);
            let nextState = result.state;

            if (result.phaseChanged) {
                const audio = useAudioSettingsStore.getState();
                if (
                    audio.enabled
                    && audio.style !== 'silent'
                    && audio.cues[nextState.phase]
                ) {
                    playPhaseCue(nextState.phase, audio.style);
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
            lastTickRef.current = null;
        };
    }, [exercise]);

    // Cue the very first phase so the session opens with sound, not silence.
    useEffect(() => {
        if (hasCuedInitialPhaseRef.current) return;
        hasCuedInitialPhaseRef.current = true;
        void ensureAudio().then((ok) => {
            if (!ok) return;
            const audio = useAudioSettingsStore.getState();
            setMasterVolume(audio.volume);
            const phase = stateRef.current.phase;
            if (
                audio.enabled
                && audio.style !== 'silent'
                && audio.cues[phase]
            ) {
                playPhaseCue(phase, audio.style);
            }
        });
    }, []);

    // Keep the master gain in sync with the persisted volume setting,
    // even if the user changes it in another tab or mid-session.
    useEffect(() => {
        setMasterVolume(useAudioSettingsStore.getState().volume);
        return useAudioSettingsStore.subscribe(
            (s) => s.volume,
            (volume) => setMasterVolume(volume),
        );
    }, []);

    const togglePause = () => {
        setState((prev) => (prev.status === 'running' ? pause(prev) : resume(prev)));
    };

    const stop = () => {
        setState((prev) => complete(prev));
    };

    const setPendingPace = (pace: number) => {
        setState((prev) => queuePace(prev, pace));
    };

    const nudgePhase = (delta: number) => {
        setState((prev) => nudgeActivePhase(prev, delta));
    };

    return {
        state,
        togglePause,
        stop,
        setPendingPace,
        nudgePhase,
        isComplete: state.status === 'complete',
    };
}

export const formatElapsed = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
