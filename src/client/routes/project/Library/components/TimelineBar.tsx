import type { Pattern } from '@/client/features/project/exercises';
import { PHASES, PHASE_COLOR_VAR } from '@/client/features/project/exercises';

type Props = {
    pattern: Pattern;
    className?: string;
};

export function TimelineBar({ pattern, className }: Props) {
    return (
        <div
            className={`flex h-1 w-full gap-0.5 overflow-hidden rounded-full ${className ?? ''}`}
            role="presentation"
        >
            {PHASES.map((phase) => {
                const value = pattern[phase];
                if (value <= 0) return null;
                return (
                    <div
                        key={phase}
                        className="h-full rounded-full"
                        style={{
                            flexGrow: value,
                            backgroundColor: `hsl(${PHASE_COLOR_VAR[phase]} / 0.85)`,
                        }}
                    />
                );
            })}
        </div>
    );
}
