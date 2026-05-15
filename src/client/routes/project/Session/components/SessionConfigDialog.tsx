import { Infinity as InfinityIcon, Minus, Plus, RotateCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/client/components/template/ui/dialog';
import { Button } from '@/client/components/template/ui/button';
import { type Pattern, type Phase } from '@/client/features/project/exercises';

const MIN_CYCLES = 1;
const MAX_CYCLES = 99;

// Matches the engine's per-phase clamp range in nudgeActivePhase.
const MIN_PHASE_SECONDS = 0;
const MAX_PHASE_SECONDS = 30;

const PHASE_LABELS: Record<Phase, string> = {
    inhale: 'Inhale',
    holdIn: 'Hold',
    exhale: 'Exhale',
    holdOut: 'Rest',
};

// Display order matches the engine's cycle order so the dialog reads
// top-to-bottom the way the breath flows.
const PHASE_ORDER: readonly Phase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cycles: number;
    onCyclesChange: (cycles: number) => void;
    cyclesDisabled?: boolean;
    cyclesDisabledHint?: string;
    pattern: Pattern;
    onPatternChange: (pattern: Pattern) => void;
    endlessEnabled: boolean;
    onEndlessToggle: () => void;
    onReset: () => void;
    canReset: boolean;
};

export function SessionConfigDialog({
    open,
    onOpenChange,
    cycles,
    onCyclesChange,
    cyclesDisabled = false,
    cyclesDisabledHint,
    pattern,
    onPatternChange,
    endlessEnabled,
    onEndlessToggle,
    onReset,
    canReset,
}: Props) {
    const stepCycles = (delta: 1 | -1) => {
        const next = Math.max(MIN_CYCLES, Math.min(MAX_CYCLES, cycles + delta));
        if (next !== cycles) onCyclesChange(next);
    };

    const stepPhase = (phase: Phase, delta: 1 | -1) => {
        const next = Math.max(
            MIN_PHASE_SECONDS,
            Math.min(MAX_PHASE_SECONDS, pattern[phase] + delta),
        );
        if (next !== pattern[phase]) onPatternChange({ ...pattern, [phase]: next });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Session settings</DialogTitle>
                    <DialogDescription>
                        Tweak this run only. Your saved exercise stays the same.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-2">
                    <section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full ${endlessEnabled
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                                aria-hidden
                            >
                                <InfinityIcon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-medium text-foreground">
                                    Endless mode
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    Keep cycling past the target.
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onEndlessToggle}
                            role="switch"
                            aria-checked={endlessEnabled}
                            aria-label={
                                endlessEnabled
                                    ? 'Disable endless mode'
                                    : 'Enable endless mode'
                            }
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${endlessEnabled
                                ? 'border-primary/60 bg-primary/40'
                                : 'border-border bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-foreground transition-transform ${endlessEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </section>

                    <section className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                Cycles
                            </span>
                            {cyclesDisabled && cyclesDisabledHint && (
                                <span className="text-[11px] text-muted-foreground">
                                    {cyclesDisabledHint}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => stepCycles(-1)}
                                disabled={cyclesDisabled || cycles <= MIN_CYCLES}
                                aria-label="Decrease cycles"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Minus className="h-5 w-5" aria-hidden />
                            </button>
                            <span
                                className={`min-w-[3.5ch] text-center font-mono tabular-nums text-3xl font-light ${cyclesDisabled ? 'text-muted-foreground' : 'text-foreground'
                                    }`}
                                aria-live="polite"
                            >
                                {cycles}
                            </span>
                            <button
                                type="button"
                                onClick={() => stepCycles(1)}
                                disabled={cyclesDisabled || cycles >= MAX_CYCLES}
                                aria-label="Increase cycles"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus className="h-5 w-5" aria-hidden />
                            </button>
                        </div>
                    </section>

                    <section className="flex flex-col gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Pattern
                        </span>
                        <div className="flex flex-col gap-2">
                            {PHASE_ORDER.map((phase) => {
                                const seconds = pattern[phase];
                                const label = PHASE_LABELS[phase];
                                return (
                                    <div
                                        key={phase}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {label}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => stepPhase(phase, -1)}
                                                disabled={seconds <= MIN_PHASE_SECONDS}
                                                aria-label={`Decrease ${label.toLowerCase()} seconds`}
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/80 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Minus className="h-4 w-4" aria-hidden />
                                            </button>
                                            <span
                                                className="min-w-[2.5ch] text-center font-mono tabular-nums text-xl font-light text-foreground"
                                                aria-live="polite"
                                            >
                                                {seconds}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => stepPhase(phase, 1)}
                                                disabled={seconds >= MAX_PHASE_SECONDS}
                                                aria-label={`Increase ${label.toLowerCase()} seconds`}
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/80 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Plus className="h-4 w-4" aria-hidden />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Pattern changes apply at the next cycle.
                        </p>
                    </section>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onReset}
                        disabled={!canReset}
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Reset to saved
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
