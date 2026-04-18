import { Minus, Plus } from 'lucide-react';
import type { Phase } from '@/client/features/project/exercises';
import { clampPhaseValue } from '@/client/features/project/exercises';

type Props = {
    phase: Phase;
    label: string;
    value: number;
    cssVar: string;
    onChange: (next: number) => void;
};

export function PhaseStepper({ phase, label, value, cssVar, onChange }: Props) {
    const dec = () => onChange(clampPhaseValue(value - 1));
    const inc = () => onChange(clampPhaseValue(value + 1));

    return (
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <div
                className="h-9 w-1 rounded-full"
                style={{ backgroundColor: `hsl(${cssVar})` }}
                aria-hidden
            />
            <div className="flex-1">
                <div className="text-sm font-medium">{label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                    {value > 0 ? `${value}s` : 'skip'}
                </div>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-xl border">
                <button
                    type="button"
                    onClick={dec}
                    disabled={value <= 0}
                    aria-label={`Decrease ${label}`}
                    className="flex min-h-11 w-11 items-center justify-center bg-muted/40 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                    <Minus className="h-4 w-4" aria-hidden />
                </button>
                <div
                    aria-live="polite"
                    className="flex min-h-11 w-12 items-center justify-center border-x bg-background font-mono text-lg tabular-nums"
                >
                    {value}
                </div>
                <button
                    type="button"
                    onClick={inc}
                    disabled={value >= 30}
                    aria-label={`Increase ${label}`}
                    className="flex min-h-11 w-11 items-center justify-center bg-muted/40 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                </button>
            </div>
            <span className="sr-only">{phase}</span>
        </div>
    );
}
