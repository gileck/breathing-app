import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { PHASES, type Pattern, type Phase } from '@/client/features/project/exercises';

const CHIP_LABELS: Record<Phase, string> = {
    inhale: 'In',
    holdIn: 'Hold',
    exhale: 'Out',
    holdOut: 'Rest',
};

type Props = {
    phase: Phase;
    pattern: Pattern;
    showNudge: boolean;
    onLongPressActive: () => void;
    onNudge: (delta: number) => void;
};

const LONG_PRESS_MS = 400;

export function PhaseChips({
    phase,
    pattern,
    showNudge,
    onLongPressActive,
    onNudge,
}: Props) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startPress = (chipPhase: Phase) => {
        if (chipPhase !== phase) return;
        timerRef.current = setTimeout(() => {
            onLongPressActive();
        }, LONG_PRESS_MS);
    };

    const cancelPress = () => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Safety: an active long-press timer would otherwise fire on a dismounted component.
    useEffect(() => cancelPress, []);

    return (
        <div className="flex items-center justify-center gap-2" role="group" aria-label="Pattern phases">
            {PHASES.map((p) => {
                const active = p === phase;
                const seconds = pattern[p];
                if (seconds <= 0) return null;

                return (
                    <div key={p} className="flex min-w-[56px] flex-col items-center">
                        {showNudge && active && (
                            <button
                                type="button"
                                onClick={() => onNudge(1)}
                                aria-label="Increase active phase by 1 second"
                                className="mb-1 flex h-6 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                            </button>
                        )}
                        <button
                            type="button"
                            onPointerDown={() => startPress(p)}
                            onPointerUp={cancelPress}
                            onPointerLeave={cancelPress}
                            onPointerCancel={cancelPress}
                            className={`flex min-h-11 min-w-[56px] flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-colors ${
                                active
                                    ? 'border-primary/70 bg-primary/25 text-foreground'
                                    : 'border-white/10 bg-transparent text-foreground/60'
                            }`}
                            aria-pressed={active}
                            aria-label={`${CHIP_LABELS[p]} ${seconds}s${active ? ' (active)' : ''}`}
                        >
                            <span className="tabular-nums text-xl leading-none">
                                {seconds}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-80">
                                {CHIP_LABELS[p]}
                            </span>
                        </button>
                        {showNudge && active && (
                            <button
                                type="button"
                                onClick={() => onNudge(-1)}
                                aria-label="Decrease active phase by 1 second"
                                className="mt-1 flex h-6 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10"
                            >
                                <Minus className="h-3.5 w-3.5" aria-hidden />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
