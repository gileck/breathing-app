import type { Exercise } from '@/client/features/project/exercises';
import {
    breathsPerMinute,
    patternString,
} from '@/client/features/project/exercises';
import { Button } from '@/client/components/template/ui/button';
import { Play } from 'lucide-react';
import { TimelineBar } from './TimelineBar';

type Props = {
    exercise: Exercise;
    eyebrow: string;
    onStart: () => void;
    onOpen: () => void;
};

export function PinnedCard({ exercise, eyebrow, onStart, onOpen }: Props) {
    return (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex flex-1 flex-col items-start gap-2 text-left"
                >
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                        {eyebrow}
                    </span>
                    <span className="text-lg font-medium leading-tight">
                        {exercise.name}
                    </span>
                    <TimelineBar pattern={exercise.pattern} className="max-w-[220px]" />
                    <span className="font-mono text-xs text-muted-foreground">
                        {patternString(exercise.pattern)} ·{' '}
                        {breathsPerMinute(exercise.pattern, exercise.pace)}/min
                    </span>
                </button>
                <Button
                    type="button"
                    size="sm"
                    onClick={onStart}
                    className="min-h-11 rounded-full px-4"
                >
                    <Play className="mr-1 h-4 w-4" aria-hidden />
                    Start
                </Button>
            </div>
        </div>
    );
}
