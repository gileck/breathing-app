import { useMemo } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { useRouter } from '@/client/features';
import {
    useExercisesStore,
    sortByLastUsed,
} from '@/client/features/project/exercises';
import { ensureAudio } from '@/client/features/project/breathing-audio';
import { ExerciseCard } from './components/ExerciseCard';

export function Library() {
    const { navigate } = useRouter();
    const exercises = useExercisesStore((s) => s.exercises);
    const toggleFavorite = useExercisesStore((s) => s.toggleFavorite);

    const startSession = (id: string) => {
        // Unlock WebAudio inside the click handler so iOS PWAs allow sound in the session.
        void ensureAudio();
        navigate(`/session/${id}`);
    };

    const { favorites, others } = useMemo(() => {
        const sorted = [...exercises].sort(sortByLastUsed);
        return {
            favorites: sorted.filter((e) => e.favorite),
            others: sorted.filter((e) => !e.favorite),
        };
    }, [exercises]);

    const renderCard = (exercise: (typeof exercises)[number]) => (
        <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onOpen={() => navigate(`/exercise/${exercise.id}`)}
            onStart={() => startSession(exercise.id)}
            onToggleFavorite={() => toggleFavorite(exercise.id)}
        />
    );

    return (
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">My Exercises</h1>
                    <p className="text-sm text-muted-foreground">
                        Build, save, and start a breathing session.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate('/audio')}
                        aria-label="Audio settings"
                        className="h-11 w-11 rounded-full"
                    >
                        <Volume2 className="h-5 w-5" aria-hidden />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => navigate('/exercise/new')}
                        aria-label="New exercise"
                        className="h-11 w-11 rounded-full"
                    >
                        <Plus className="h-5 w-5" aria-hidden />
                    </Button>
                </div>
            </div>

            {favorites.length > 0 && (
                <section className="mb-6">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Favorites
                    </div>
                    <div className="flex flex-col gap-2">
                        {favorites.map(renderCard)}
                    </div>
                </section>
            )}

            {others.length > 0 && (
                <section>
                    {favorites.length > 0 && (
                        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            All exercises
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        {others.map(renderCard)}
                    </div>
                </section>
            )}

            {exercises.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center">
                    <p className="mb-2 text-lg font-medium">No exercises yet</p>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Create your first breathing pattern to get started.
                    </p>
                    <Button
                        type="button"
                        onClick={() => navigate('/exercise/new')}
                        className="rounded-full"
                    >
                        <Plus className="mr-2 h-4 w-4" aria-hidden />
                        New exercise
                    </Button>
                </div>
            )}
        </div>
    );
}
