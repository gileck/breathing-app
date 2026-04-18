import { ChevronUp, ChevronDown } from 'lucide-react';

type Props = {
    pace: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (next: number) => void;
};

const roundToStep = (value: number, step: number): number =>
    parseFloat((Math.round(value / step) * step).toFixed(2));

export function TempoButtons({
    pace,
    min = 0.6,
    max = 1.4,
    step = 0.05,
    onChange,
}: Props) {
    const atMin = pace <= min + 1e-6;
    const atMax = pace >= max - 1e-6;

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(roundToStep(Math.min(max, pace + step), step))}
                disabled={atMax}
                aria-label="Faster pace"
                className="flex h-[72px] w-12 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/40 bg-primary/15 text-foreground shadow-[0_0_16px_hsl(var(--primary)/0.15)] transition-colors hover:bg-primary/25 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground disabled:shadow-none"
            >
                <ChevronUp className="h-5 w-5" aria-hidden />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">
                    Fast
                </span>
            </button>

            <div className="flex flex-col items-center gap-0.5 py-2">
                <div
                    className={`font-mono text-sm font-medium tabular-nums ${
                        pace === 1 ? 'text-muted-foreground' : 'text-primary'
                    }`}
                >
                    {pace.toFixed(2)}×
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    tempo
                </div>
            </div>

            <button
                type="button"
                onClick={() => onChange(roundToStep(Math.max(min, pace - step), step))}
                disabled={atMin}
                aria-label="Slower pace"
                className="flex h-[72px] w-12 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/40 bg-primary/15 text-foreground shadow-[0_0_16px_hsl(var(--primary)/0.15)] transition-colors hover:bg-primary/25 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground disabled:shadow-none"
            >
                <ChevronDown className="h-5 w-5" aria-hidden />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">
                    Slow
                </span>
            </button>
        </div>
    );
}
