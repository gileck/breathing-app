import { useEffect, useMemo, useState } from 'react';
import { X, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from '@/client/features';
import {
    useExercisesStore,
    selectExerciseById,
    patternString,
    breathsPerMinute,
} from '@/client/features/project/exercises';
import {
    phaseCountdownSeconds,
    phaseProgress,
    shapeScaleForPhase,
    hasPendingChanges,
} from '@/client/features/project/breath-engine';
import { useAudioSettingsStore } from '@/client/features/project/breathing-audio';
import { BreathOrb } from './components/BreathOrb';
import { PhaseChips } from './components/PhaseChips';
import { TempoButtons } from './components/TempoButtons';
import { SessionStats } from './components/SessionStats';
import { useBreathSession, formatElapsed } from './hooks';

const PHASE_LABELS = {
    inhale: 'Breathe in',
    holdIn: 'Hold',
    exhale: 'Breathe out',
    holdOut: 'Rest',
} as const;

export function Session() {
    const { navigate, routeParams } = useRouter();
    const exerciseId = routeParams.id;

    const exercise = useExercisesStore(selectExerciseById(exerciseId));
    const touchLastUsed = useExercisesStore((s) => s.touchLastUsed);

    useEffect(() => {
        if (exerciseId) touchLastUsed(exerciseId);
    }, [exerciseId, touchLastUsed]);

    if (!exercise) {
        return (
            <div className="dark breath-session-surface flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-base">Exercise not found.</p>
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="min-h-11 rounded-full border border-white/20 bg-white/5 px-4 text-sm"
                >
                    Back to library
                </button>
            </div>
        );
    }

    return <SessionContent exerciseId={exercise.id} />;
}

function SessionContent({ exerciseId }: { exerciseId: string }) {
    const { navigate } = useRouter();
    const exercise = useExercisesStore(selectExerciseById(exerciseId));
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI toggle tied to this session instance
    const [showNudge, setShowNudge] = useState(false);

    // exercise is guaranteed non-null here (checked in parent) but TS doesn't know.
    const safeExercise = exercise!;
    const engine = useBreathSession(safeExercise);
    const { state, togglePause, stop, setPendingPace, nudgePhase, isComplete } = engine;

    const audioEnabled = useAudioSettingsStore((s) => s.enabled);
    const toggleAudio = useAudioSettingsStore((s) => s.toggleEnabled);

    useEffect(() => {
        if (isComplete) navigate('/');
    }, [isComplete, navigate]);

    const countdown = phaseCountdownSeconds(state);
    const scale = useMemo(
        () => shapeScaleForPhase(state.phase, phaseProgress(state)),
        // Scale only depends on phase progress math — ignore cycle / totalElapsedMs churn.
        [state.phase, state.phaseElapsedMs, state.pattern, state.pace],
    );
    const effectivePattern = state.pendingPattern ?? state.pattern;
    const effectivePace = state.pendingPace ?? state.pace;
    const pending = hasPendingChanges(state);
    const targetCycles =
        safeExercise.length.kind === 'cycles' ? safeExercise.length.value : null;

    return (
        <div className="dark breath-session-surface relative flex min-h-screen flex-col overflow-hidden">
            <div className="flex items-start justify-between px-5 pt-6">
                <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Cycle
                    </span>
                    <span className="font-mono tabular-nums text-base">
                        {(state.cycle + 1).toString().padStart(2, '0')}
                        {targetCycles !== null && (
                            <span className="text-muted-foreground">
                                {' / '}
                                {targetCycles}
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleAudio}
                        aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
                        aria-pressed={!audioEnabled}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                    >
                        {audioEnabled ? (
                            <Volume2 className="h-5 w-5" aria-hidden />
                        ) : (
                            <VolumeX className="h-5 w-5" aria-hidden />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={stop}
                        aria-label="End session"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-[148px] flex flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
                    {patternString(safeExercise.pattern, ' · ')}
                </span>
                <span className="text-2xl font-light tracking-tight">
                    {PHASE_LABELS[state.phase]}
                    {(state.phase === 'inhale' || state.phase === 'exhale') && '…'}
                </span>
            </div>

            <div className="flex flex-1 items-center justify-center">
                <BreathOrb scale={scale} countdown={countdown} />
            </div>

            <div className="absolute inset-x-0 bottom-[168px] flex justify-center px-20">
                <PhaseChips
                    phase={state.phase}
                    pattern={effectivePattern}
                    showNudge={showNudge}
                    onLongPressActive={() => setShowNudge((prev) => !prev)}
                    onNudge={nudgePhase}
                />
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <div className="pointer-events-auto">
                    <TempoButtons
                        pace={effectivePace}
                        onChange={setPendingPace}
                    />
                </div>
            </div>

            {pending && (
                <div className="pointer-events-none absolute inset-x-0 bottom-[120px] flex justify-center">
                    <div className="rounded-full border border-primary/50 bg-primary/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        Updates next cycle
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4 px-6 pb-10">
                <button
                    type="button"
                    onClick={togglePause}
                    aria-label={state.status === 'paused' ? 'Resume' : 'Pause'}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                >
                    {state.status === 'paused' ? (
                        <Play className="h-5 w-5" aria-hidden />
                    ) : (
                        <Pause className="h-5 w-5" aria-hidden />
                    )}
                </button>

                <SessionStats
                    stats={[
                        { label: 'Elapsed', value: formatElapsed(state.totalElapsedMs) },
                        {
                            label: 'Rate',
                            value: `${breathsPerMinute(effectivePattern, effectivePace)}/min`,
                        },
                        {
                            label: 'Tempo',
                            value: `${effectivePace.toFixed(2)}×`,
                            highlight: effectivePace !== 1,
                        },
                    ]}
                />

                <div className="h-11 w-11" aria-hidden />
            </div>
        </div>
    );
}
