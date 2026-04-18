import type { Exercise } from '@/client/features/project/exercises';
import {
    breathsPerMinute,
    formatLastUsed,
    patternString,
} from '@/client/features/project/exercises';
import { Star, ChevronRight } from 'lucide-react';
import { TimelineBar } from './TimelineBar';

type Props = {
    exercise: Exercise;
    onOpen: () => void;
    onStart: () => void;
    onToggleFavorite: () => void;
};

export function ExerciseCard({ exercise, onOpen, onStart, onToggleFavorite }: Props) {
    return (
        <div className="flex items-stretch gap-2 rounded-xl border bg-card text-card-foreground transition-colors hover:bg-accent/30">
            <button
                type="button"
                onClick={onToggleFavorite}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-l-xl pl-3 text-muted-foreground hover:text-foreground"
                aria-label={exercise.favorite ? 'Unpin exercise' : 'Pin exercise'}
            >
                <Star
                    size={18}
                    className={exercise.favorite ? 'fill-primary text-primary' : ''}
                />
            </button>

            <button
                type="button"
                onClick={onOpen}
                className="flex flex-1 flex-col items-start gap-2 py-3 pr-1 text-left"
            >
                <div className="font-medium leading-tight">{exercise.name}</div>
                <TimelineBar pattern={exercise.pattern} className="max-w-[180px]" />
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span>{patternString(exercise.pattern)}</span>
                    <span aria-hidden>·</span>
                    <span>{breathsPerMinute(exercise.pattern, exercise.pace)}/min</span>
                    <span aria-hidden>·</span>
                    <span>{formatLastUsed(exercise.lastUsedAt)}</span>
                </div>
            </button>

            <button
                type="button"
                onClick={onStart}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-r-xl pr-3 text-muted-foreground hover:text-foreground"
                aria-label={`Start ${exercise.name}`}
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
