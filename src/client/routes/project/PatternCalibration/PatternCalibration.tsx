import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, Save, Timer } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { Input } from '@/client/components/template/ui/input';
import { useRouter } from '@/client/features';
import {
    clampPhaseValue,
    isPatternValid,
    patternString,
    PHASE_COLOR_VAR,
    PHASES,
    useExercisesStore,
    type Pattern,
    type Phase,
} from '@/client/features/project/exercises';
import { ensureAudio } from '@/client/features/project/breathing-audio';

const PHASE_LABELS: Record<Phase, string> = {
    inhale: 'Inhale',
    holdIn: 'Hold in',
    exhale: 'Exhale',
    holdOut: 'Hold out',
};

const PHASE_PROMPTS: Record<Phase, string> = {
    inhale: 'Breathe in naturally. Tap when you move into your hold.',
    holdIn: 'Hold comfortably. Tap when you start breathing out.',
    exhale: 'Breathe out naturally. Tap when you reach the empty hold.',
    holdOut: 'Rest at the bottom. Tap when you are ready to inhale again.',
};

const EMPTY_PATTERN: Pattern = { inhale: 0, holdIn: 0, exhale: 0, holdOut: 0 };

const measuredSeconds = (elapsedMs: number): number =>
    Math.max(1, clampPhaseValue(elapsedMs / 1000));

const phaseFromIndex = (index: number): Phase => PHASES[index] ?? 'inhale';

export function PatternCalibration() {
    const { navigate } = useRouter();
    const addExercise = useExercisesStore((s) => s.addExercise);

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral calibration flow state
    const [activePhaseIndex, setActivePhaseIndex] = useState<number | null>(null);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral measured draft before user saves an exercise
    const [draftPattern, setDraftPattern] = useState<Pattern>(EMPTY_PATTERN);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral live counter display
    const [elapsedMs, setElapsedMs] = useState(0);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral completion mode before save
    const [complete, setComplete] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral save form value
    const [nameDraft, setNameDraft] = useState('');

    const phaseStartRef = useRef<number | null>(null);

    useEffect(() => {
        if (activePhaseIndex === null) return;
        let raf: number | null = null;

        const tick = (now: number) => {
            if (phaseStartRef.current !== null) {
                setElapsedMs(now - phaseStartRef.current);
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => {
            if (raf !== null) cancelAnimationFrame(raf);
        };
    }, [activePhaseIndex]);

    const startPhase = (index: number) => {
        phaseStartRef.current = performance.now();
        setElapsedMs(0);
        setActivePhaseIndex(index);
    };

    const reset = () => {
        phaseStartRef.current = null;
        setActivePhaseIndex(null);
        setDraftPattern(EMPTY_PATTERN);
        setElapsedMs(0);
        setComplete(false);
        setNameDraft('');
    };

    const saveCurrentPhase = (seconds: number) => {
        if (activePhaseIndex === null) return;
        const phase = phaseFromIndex(activePhaseIndex);
        const nextPattern = { ...draftPattern, [phase]: seconds };
        setDraftPattern(nextPattern);

        const nextIndex = activePhaseIndex + 1;
        if (nextIndex >= PHASES.length) {
            phaseStartRef.current = null;
            setActivePhaseIndex(null);
            setElapsedMs(0);
            setComplete(true);
            return;
        }

        startPhase(nextIndex);
    };

    const handlePrimaryAction = () => {
        if (complete) return;
        if (activePhaseIndex === null) {
            startPhase(0);
            return;
        }
        saveCurrentPhase(measuredSeconds(elapsedMs));
    };

    const saveExercise = (startAfterSave: boolean) => {
        if (!isPatternValid(draftPattern)) return;
        const exercise = addExercise({
            name: nameDraft.trim() || `Measured ${patternString(draftPattern)}`,
            pattern: draftPattern,
            length: { kind: 'cycles', value: 12 },
            favorite: false,
            meditation: false,
        });
        if (startAfterSave) {
            void ensureAudio();
            navigate(`/session/${exercise.id}`);
            return;
        }
        navigate(`/exercise/${exercise.id}`);
    };

    const activePhase = activePhaseIndex === null ? null : phaseFromIndex(activePhaseIndex);
    const counter = Math.max(1, Math.round(elapsedMs / 1000));
    const completedPatternLabel = patternString(draftPattern);

    return (
        <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-24 pt-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate('/')}
                        aria-label="Back to library"
                        className="h-11 w-11 flex-shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Measure pattern
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Use one natural cycle to create a saved exercise.
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={reset}
                    aria-label="Restart measurement"
                    className="h-11 w-11 flex-shrink-0"
                >
                    <RotateCcw className="h-5 w-5" aria-hidden />
                </Button>
            </div>

            {!complete ? (
                <div className="flex flex-1 flex-col">
                    <div className="mb-5 rounded-3xl border bg-card p-5">
                        <div className="mb-4 grid grid-cols-4 gap-2">
                            {PHASES.map((phase, index) => {
                                const measured = draftPattern[phase];
                                const active = index === activePhaseIndex;
                                return (
                                    <div
                                        key={phase}
                                        className={`rounded-2xl border p-3 text-center ${
                                            active ? 'border-primary bg-primary/10' : 'bg-background'
                                        }`}
                                    >
                                        <div
                                            className="mx-auto mb-2 h-2 w-8 rounded-full"
                                            style={{ background: PHASE_COLOR_VAR[phase] }}
                                            aria-hidden
                                        />
                                        <div className="text-[11px] font-medium">
                                            {PHASE_LABELS[phase]}
                                        </div>
                                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                                            {measured > 0 ? `${measured}s` : active ? 'now' : '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rounded-3xl bg-muted/40 px-5 py-8 text-center">
                            {activePhase ? (
                                <>
                                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                                        {PHASE_LABELS[activePhase]}
                                    </div>
                                    <div className="mt-4 font-mono text-8xl font-light tabular-nums tracking-[-0.08em]">
                                        {counter}
                                    </div>
                                    <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
                                        {PHASE_PROMPTS[activePhase]}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Timer className="mx-auto h-10 w-10 text-primary" aria-hidden />
                                    <div className="mt-4 text-2xl font-medium">
                                        Start with your inhale
                                    </div>
                                    <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
                                        Tap once to begin. After that, tap whenever your body naturally changes phase.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                        <Button
                            type="button"
                            onClick={handlePrimaryAction}
                            className="h-14 rounded-2xl text-base"
                        >
                            {activePhase
                                ? `Switch from ${PHASE_LABELS[activePhase].toLowerCase()}`
                                : 'Start measuring'}
                        </Button>
                        {activePhase && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => saveCurrentPhase(0)}
                                className="h-12 rounded-2xl"
                            >
                                Skip this phase
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="rounded-3xl border bg-card p-6 text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                            Detected pattern
                        </div>
                        <div className="mt-3 font-mono text-5xl font-light tracking-[-0.05em]">
                            {completedPatternLabel}
                        </div>
                        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                            This will be saved as a regular pattern exercise. You can edit it later and use the normal pace controls during sessions.
                        </p>
                    </div>

                    <div className="rounded-2xl border bg-card p-4">
                        <label htmlFor="measured-exercise-name" className="text-sm font-medium">
                            Exercise name
                        </label>
                        <Input
                            id="measured-exercise-name"
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            placeholder={`Measured ${completedPatternLabel}`}
                            className="mt-2 h-12"
                        />
                    </div>

                    {!isPatternValid(draftPattern) && (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                            At least one phase needs a duration before this can be saved.
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button
                            type="button"
                            onClick={() => saveExercise(true)}
                            disabled={!isPatternValid(draftPattern)}
                            className="h-14 rounded-2xl text-base"
                        >
                            <Play className="mr-2 h-4 w-4" aria-hidden />
                            Save and start
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => saveExercise(false)}
                            disabled={!isPatternValid(draftPattern)}
                            className="h-12 rounded-2xl"
                        >
                            <Save className="mr-2 h-4 w-4" aria-hidden />
                            Save exercise
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
