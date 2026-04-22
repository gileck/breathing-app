import type { Exercise } from '@/client/features/project/exercises';
import {
    breathsPerMinute,
    formatLastUsed,
    lengthLabel,
    patternString,
} from '@/client/features/project/exercises';
import { Star, Play } from 'lucide-react';
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
                aria-label={exercise.favorite ? 'Remove from favorites' : 'Add to favorites'}
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
                <div className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted-foreground">
                    <span>{patternString(exercise.pattern)}</span>
                    <span aria-hidden>·</span>
                    <span>{breathsPerMinute(exercise.pattern)}/min</span>
                    <span aria-hidden>·</span>
                    <span>{lengthLabel(exercise.length)}</span>
                    <span aria-hidden>·</span>
                    <span>{formatLastUsed(exercise.lastUsedAt)}</span>
                </div>
            </button>

            <button
                type="button"
                onClick={onStart}
                aria-label={`Start ${exercise.name}`}
                className="mr-3 flex h-11 w-11 flex-shrink-0 items-center justify-center self-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
                <Play className="h-[18px] w-[18px] fill-current" aria-hidden />
            </button>
        </div>
    );
}
