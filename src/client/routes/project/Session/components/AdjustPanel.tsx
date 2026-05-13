import { useEffect, useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import {
    PHASES,
    PHASE_COLOR_VAR,
    type Pattern,
    type Phase,
} from '@/client/features/project/exercises';

const PHASE_SHORT: Record<Phase, string> = {
    inhale: 'In',
    holdIn: 'Hold',
    exhale: 'Out',
    holdOut: 'Rest',
};

type AdjustPanelProps = {
    open: boolean;
    onClose: () => void;
    pattern: Pattern;
    hasPending: boolean;
    onAdjustPhase: (phase: Phase, delta: number) => void;
    targetCycles: number | null;
    currentCycle: number;
    onIncrementCycles: () => void;
    onDecrementCycles: () => void;
    bgMusicEnabled: boolean;
    bgShouldPlay: boolean;
    onToggleBgMusic: () => void;
};

export function AdjustPanel({
    open,
    onClose,
    pattern,
    hasPending,
    onAdjustPhase,
    targetCycles,
    currentCycle,
    onIncrementCycles,
    onDecrementCycles,
    bgMusicEnabled,
    bgShouldPlay,
    onToggleBgMusic,
}: AdjustPanelProps) {
    // Mount the panel as soon as `open` flips, then on the next frame slide
    // it into place. Unmount only after the slide-out finishes so the close
    // animation actually plays.
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral mount/animation flags tied to a single transition
    const [mounted, setMounted] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral mount/animation flags tied to a single transition
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // Defer "shown" so the initial translate-y-full renders before
            // we flip to translate-y-0, which is what triggers the slide.
            const id = requestAnimationFrame(() => setShown(true));
            return () => cancelAnimationFrame(id);
        }
        setShown(false);
        const timer = setTimeout(() => setMounted(false), 250);
        return () => clearTimeout(timer);
    }, [open]);

    if (!mounted) return null;

    const showCycles = targetCycles !== null;
    const showMusic = bgMusicEnabled;

    return (
        <>
            <button
                type="button"
                aria-label="Close adjust panel"
                onClick={onClose}
                className="absolute inset-0 z-30 cursor-default bg-transparent"
            />
            <div
                role="dialog"
                aria-label="Adjust session"
                className="absolute inset-x-0 bottom-0 z-40 transition-transform duration-[250ms] ease-out"
                style={{
                    transform: shown ? 'translateY(0)' : 'translateY(100%)',
                }}
            >
                <div className="mx-auto max-w-md rounded-t-3xl border border-white/10 bg-background/95 px-6 pb-8 pt-5 shadow-[0_-20px_60px_hsl(var(--primary)/0.18)] backdrop-blur-md">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/85">
                            Adjust
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    </div>

                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                Pattern
                            </span>
                            {hasPending && (
                                <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                                    Updates next cycle
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {PHASES.map((phase) => (
                                <div
                                    key={phase}
                                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-3"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor: `hsl(${PHASE_COLOR_VAR[phase]})`,
                                            }}
                                            aria-hidden
                                        />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                                            {PHASE_SHORT[phase]}
                                        </span>
                                    </div>
                                    <span className="font-mono tabular-nums text-2xl font-light text-foreground">
                                        {pattern[phase]}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onAdjustPhase(phase, -1)}
                                            aria-label={`Decrease ${PHASE_SHORT[phase]}`}
                                            disabled={pattern[phase] <= 0}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10 disabled:opacity-30"
                                        >
                                            <Minus className="h-3.5 w-3.5" aria-hidden />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAdjustPhase(phase, 1)}
                                            aria-label={`Increase ${PHASE_SHORT[phase]}`}
                                            disabled={pattern[phase] >= 30}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10 disabled:opacity-30"
                                        >
                                            <Plus className="h-3.5 w-3.5" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {showCycles && (
                        <section className="mt-5 border-t border-white/5 pt-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                    Cycles
                                </span>
                                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                                    on {currentCycle + 1}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={onDecrementCycles}
                                    aria-label="Decrease cycles"
                                    disabled={
                                        targetCycles === null ||
                                        targetCycles <= currentCycle + 1
                                    }
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-foreground shadow-[0_0_16px_hsl(var(--primary)/0.15)] hover:bg-primary/25 disabled:opacity-30 disabled:shadow-none"
                                >
                                    <Minus className="h-4 w-4" aria-hidden />
                                </button>
                                <span className="font-mono tabular-nums text-3xl font-light text-foreground">
                                    {targetCycles}
                                </span>
                                <button
                                    type="button"
                                    onClick={onIncrementCycles}
                                    aria-label="Increase cycles"
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-foreground shadow-[0_0_16px_hsl(var(--primary)/0.15)] hover:bg-primary/25"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                </button>
                            </div>
                        </section>
                    )}

                    {showMusic && (
                        <section className="mt-5 border-t border-white/5 pt-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                    Music
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span
                                    className={`font-mono text-[12px] ${bgShouldPlay ? 'text-primary' : 'text-muted-foreground'}`}
                                >
                                    <span
                                        aria-hidden
                                        className={bgShouldPlay ? '' : 'opacity-40'}
                                    >
                                        ♪
                                    </span>{' '}
                                    {bgShouldPlay ? 'Playing' : 'Paused'}
                                </span>
                                <button
                                    type="button"
                                    onClick={onToggleBgMusic}
                                    aria-label={bgShouldPlay ? 'Pause background music' : 'Play background music'}
                                    className="flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/85 hover:bg-white/10"
                                >
                                    {bgShouldPlay ? 'Pause' : 'Play'}
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
