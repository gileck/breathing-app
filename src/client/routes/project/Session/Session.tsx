import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Infinity as InfinityIcon } from 'lucide-react';
import { useRouter } from '@/client/features';
import {
    useExercisesStore,
    selectExerciseById,
    patternString,
    breathsPerMinute,
    estimatedDurationSeconds,
    totalSeconds,
} from '@/client/features/project/exercises';
import {
    phaseCountdownSeconds,
    phaseProgress,
    shapeScaleForPhase,
    hasPendingChanges,
} from '@/client/features/project/breath-engine';
import {
    ensureAudio,
    getMeditationDuration,
    getMeditationEndDuration,
    getStartingCueDuration,
    playMeditation,
    playMeditationEnd,
    playStartingCue,
    preloadMeditation,
    preloadMeditationEnd,
    preloadSampleForStyle,
    preloadStartingCue,
    preloadVoiceSamples,
    setMasterVolume,
    stopAllSamples,
    useAudioSettingsStore,
} from '@/client/features/project/breathing-audio';
import { useBackgroundMusicRuntimeStore } from '@/client/features/project/background-music';
import { BreathOrb } from './components/BreathOrb';
import { PhaseChips } from './components/PhaseChips';
import { TempoButtons } from './components/TempoButtons';
import { SessionStats } from './components/SessionStats';
import { useBreathSession, formatElapsed } from './hooks';
import { useEndlessSessionStore } from './store';

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
            <div className="dark breath-session-surface flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
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
    const {
        state,
        beginSession,
        togglePause,
        setPendingPace,
        nudgePhase,
        isComplete,
        isIdle,
    } = engine;

    const audioEnabled = useAudioSettingsStore((s) => s.enabled);
    const toggleAudio = useAudioSettingsStore((s) => s.toggleEnabled);
    const setBgShouldPlay = useBackgroundMusicRuntimeStore((s) => s.setShouldPlay);
    const endlessEnabled = useEndlessSessionStore((s) => s.enabled);
    const toggleEndless = useEndlessSessionStore((s) => s.toggleEnabled);

    // 3 → 2 → 1, advances through timers bound to the audio cue's real duration.
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pre-session countdown driven by setTimeout
    const [countdownDigit, setCountdownDigit] = useState(3);
    // Tracks which pre-session step we're showing while the engine stays idle.
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pre-session sequencing driven by setTimeout
    const [preStartStep, setPreStartStep] = useState<'meditation' | 'countdown'>(
        safeExercise.meditation ? 'meditation' : 'countdown',
    );
    // When the engine completes and the exercise has meditation enabled, we
    // hold the Session mounted for the wrap-up audio instead of snapping
    // straight back to the library.
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral end-of-session step driven by setTimeout
    const [showEndMeditation, setShowEndMeditation] = useState(false);

    useEffect(() => {
        setBgShouldPlay(true);
        return () => setBgShouldPlay(false);
    }, [setBgShouldPlay]);

    // Cut off any in-flight sample playback (long meditation/starting cues
    // most importantly) when the user bails out of the session.
    useEffect(() => {
        return () => stopAllSamples();
    }, []);

    // Pre-session sequence: optional meditation → 3/2/1 countdown → engine starts.
    // Driven by real sample durations when available, with sensible fallbacks.
    const preSessionStartedRef = useRef(false);
    // Populated while the meditation intro is playing so the UI's Skip
    // button can jump straight to the countdown.
    const skipIntroRef = useRef<(() => void) | null>(null);
    useEffect(() => {
        if (!isIdle) return;
        if (preSessionStartedRef.current) return;
        preSessionStartedRef.current = true;
        const timers: ReturnType<typeof setTimeout>[] = [];
        let cancelled = false;
        const fallbackCountdownMs = 3000;
        const fallbackMeditationMs = 15000;
        const withMeditation = Boolean(safeExercise.meditation);

        const runCountdown = (audioEnabled: boolean) => {
            setPreStartStep('countdown');
            setCountdownDigit(3);
            let durationMs = fallbackCountdownMs;
            const warm = getStartingCueDuration();
            if (warm > 0) durationMs = warm * 1000;
            if (audioEnabled) playStartingCue();

            const third = durationMs / 3;
            timers.push(setTimeout(() => setCountdownDigit(2), third));
            timers.push(setTimeout(() => setCountdownDigit(1), third * 2));
            timers.push(setTimeout(() => beginSession(), durationMs));
        };

        const run = async () => {
            const ok = await ensureAudio();
            const audio = useAudioSettingsStore.getState();
            const audioEnabled = ok && audio.enabled;

            if (ok) {
                setMasterVolume(audio.volume);
                // Warm phase-cue buffers while the pre-session is running so
                // the very first phase cue lands clean.
                void preloadSampleForStyle(audio.style);
                if (audio.voice) void preloadVoiceSamples();
                // Kick off both warmups in parallel so the countdown is ready
                // immediately after meditation ends.
                await Promise.all([
                    withMeditation ? preloadMeditation() : Promise.resolve(0),
                    withMeditation ? preloadMeditationEnd() : Promise.resolve(0),
                    preloadStartingCue(),
                ]);
            }
            if (cancelled) return;

            if (withMeditation) {
                let meditationMs = fallbackMeditationMs;
                const warm = getMeditationDuration();
                if (warm > 0) meditationMs = warm * 1000;
                if (audioEnabled) playMeditation();
                const meditationTimer = setTimeout(() => {
                    if (cancelled) return;
                    skipIntroRef.current = null;
                    runCountdown(audioEnabled);
                }, meditationMs);
                timers.push(meditationTimer);
                skipIntroRef.current = () => {
                    clearTimeout(meditationTimer);
                    skipIntroRef.current = null;
                    // Cut off the intro audio so it doesn't bleed into the countdown.
                    stopAllSamples();
                    runCountdown(audioEnabled);
                };
            } else {
                runCountdown(audioEnabled);
            }
        };

        void run();
        return () => {
            cancelled = true;
            skipIntroRef.current = null;
            timers.forEach(clearTimeout);
        };
    }, [isIdle, beginSession, safeExercise.meditation]);

    // Completion → optional end-meditation wrap-up → navigate back.
    useEffect(() => {
        if (!isComplete) return;
        const audio = useAudioSettingsStore.getState();
        if (!safeExercise.meditation) {
            navigate('/');
            return;
        }
        setShowEndMeditation(true);
        // Playback only if audio is enabled; visual wrap-up shows regardless.
        if (audio.enabled) playMeditationEnd();
        const durationMs = (getMeditationEndDuration() || 15) * 1000;
        const timer = setTimeout(() => navigate('/'), durationMs);
        return () => clearTimeout(timer);
    }, [isComplete, navigate, safeExercise.meditation]);

    const countdown = phaseCountdownSeconds(state);
    const scale = useMemo(
        () => shapeScaleForPhase(state.phase, phaseProgress(state)),
        // Scale only depends on phase progress math — ignore cycle / totalElapsedMs churn.
        [state.phase, state.phaseElapsedMs, state.pattern, state.pace],
    );
    const effectivePattern = state.pendingPattern ?? state.pattern;
    const effectivePace = state.pendingPace ?? state.pace;
    const pending = hasPendingChanges(state);
    // Derive a target cycle count even for minutes-based (legacy) lengths so
    // the CYCLE readout always shows progress / total.
    const targetCycles = (() => {
        if (safeExercise.length.kind === 'cycles') return safeExercise.length.value;
        if (safeExercise.length.kind === 'minutes') {
            const cycleSec = totalSeconds(safeExercise.pattern);
            if (cycleSec <= 0) return null;
            return Math.max(1, Math.round((safeExercise.length.value * 60) / cycleSec));
        }
        return null;
    })();

    if (showEndMeditation) {
        return (
            <div className="dark breath-session-surface relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div
                        className="breath-halo h-40 w-40 rounded-full"
                        style={{ animation: 'breath-pulse 3s ease-in-out infinite' }}
                        aria-hidden
                    />
                    <div className="flex flex-col items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/80">
                            Wrapping up
                        </span>
                        <span className="text-lg font-light text-foreground/85">
                            Nice work. Take a moment before standing.
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    aria-label="Finish session"
                    className="absolute right-5 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                >
                    <X className="h-5 w-5" aria-hidden />
                </button>
            </div>
        );
    }

    if (isIdle) {
        const isMeditation = preStartStep === 'meditation';
        return (
            <div className="dark breath-session-surface relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
                {isMeditation ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="breath-halo h-40 w-40 rounded-full" style={{ animation: 'breath-pulse 3s ease-in-out infinite' }} aria-hidden />
                        <div className="flex flex-col items-center gap-2">
                            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/80">
                                Settling in
                            </span>
                            <span className="text-lg font-light text-foreground/85">
                                Take a moment. The exercise begins shortly.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => skipIntroRef.current?.()}
                            className="mt-4 min-h-11 rounded-full border border-white/15 bg-white/5 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:bg-white/10"
                        >
                            Skip intro
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Starting in
                        </span>
                        <span
                            key={countdownDigit}
                            aria-live="polite"
                            className="font-light tabular-nums text-foreground"
                            style={{
                                fontSize: 160,
                                letterSpacing: '-0.04em',
                                textShadow: '0 2px 40px hsl(var(--primary) / 0.4)',
                                animation: 'countdown-pulse 700ms ease-out',
                            }}
                        >
                            {countdownDigit}
                        </span>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    aria-label="Cancel session"
                    className="absolute right-5 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                >
                    <X className="h-5 w-5" aria-hidden />
                </button>
            </div>
        );
    }

    return (
        <div className="dark breath-session-surface relative flex h-full flex-col overflow-hidden">
            <div className="flex items-start justify-between px-5 pt-6">
                {(() => {
                    // Total time shown at 1× pace — runtime pace tweaks just
                    // stretch/compress actual duration from this baseline.
                    const totalSec = estimatedDurationSeconds(
                        safeExercise.pattern,
                        1,
                        safeExercise.length,
                    );
                    const totalClock = (seconds: number): string => {
                        const t = Math.max(0, Math.round(seconds));
                        return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
                    };
                    return (
                        <div className="flex items-start gap-6">
                            <div className="flex flex-col">
                                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Cycle
                                </span>
                                <span className="font-mono tabular-nums text-base">
                                    {targetCycles !== null && !endlessEnabled ? (
                                        <>
                                            ({state.cycle + 1}
                                            <span className="text-muted-foreground">
                                                /{targetCycles}
                                            </span>
                                            )
                                        </>
                                    ) : (
                                        state.cycle + 1
                                    )}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Time
                                </span>
                                <span className="font-mono tabular-nums text-base">
                                    {formatElapsed(state.totalElapsedMs)}
                                    {!endlessEnabled && totalSec !== null && totalSec > 0 && (
                                        <span className="text-muted-foreground">
                                            /{totalClock(totalSec)}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })()}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleEndless}
                        aria-label={
                            endlessEnabled ? 'Disable endless mode' : 'Enable endless mode'
                        }
                        aria-pressed={endlessEnabled}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border ${endlessEnabled
                            ? 'border-primary/60 bg-primary/20 text-primary'
                            : 'border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10'
                            }`}
                    >
                        <InfinityIcon className="h-5 w-5" aria-hidden />
                    </button>
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
                        onClick={() => navigate('/')}
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
