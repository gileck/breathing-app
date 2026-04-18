import { createStore } from '@/client/stores';
import { generateId } from '@/client/utils/id';
import type { Exercise, Pattern, SessionLength } from './types';
import { SEED_EXERCISES } from './seed';

export type ExerciseDraft = {
    name: string;
    pattern: Pattern;
    pace: number;
    length: SessionLength;
    favorite: boolean;
};

type ExercisesState = {
    exercises: Exercise[];
    seeded: boolean;
    addExercise: (draft: ExerciseDraft) => Exercise;
    updateExercise: (id: string, patch: Partial<ExerciseDraft>) => void;
    deleteExercise: (id: string) => void;
    duplicateExercise: (id: string) => Exercise | undefined;
    toggleFavorite: (id: string) => void;
    touchLastUsed: (id: string) => void;
};

export const useExercisesStore = createStore<ExercisesState>({
    key: 'breathing-exercises',
    label: 'Breathing Exercises',
    creator: (set, get) => ({
        exercises: SEED_EXERCISES,
        seeded: true,
        addExercise: (draft) => {
            const now = new Date().toISOString();
            const exercise: Exercise = {
                id: generateId(),
                ...draft,
                createdAt: now,
                updatedAt: now,
            };
            set({ exercises: [exercise, ...get().exercises] });
            return exercise;
        },
        updateExercise: (id, patch) => {
            const now = new Date().toISOString();
            set({
                exercises: get().exercises.map((e) =>
                    e.id === id ? { ...e, ...patch, updatedAt: now } : e,
                ),
            });
        },
        deleteExercise: (id) => {
            set({ exercises: get().exercises.filter((e) => e.id !== id) });
        },
        duplicateExercise: (id) => {
            const source = get().exercises.find((e) => e.id === id);
            if (!source) return undefined;
            const now = new Date().toISOString();
            const copy: Exercise = {
                ...source,
                id: generateId(),
                name: `${source.name} Copy`,
                favorite: false,
                lastUsedAt: undefined,
                createdAt: now,
                updatedAt: now,
            };
            set({ exercises: [copy, ...get().exercises] });
            return copy;
        },
        toggleFavorite: (id) => {
            set({
                exercises: get().exercises.map((e) =>
                    e.id === id ? { ...e, favorite: !e.favorite } : e,
                ),
            });
        },
        touchLastUsed: (id) => {
            const now = new Date().toISOString();
            set({
                exercises: get().exercises.map((e) =>
                    e.id === id ? { ...e, lastUsedAt: now } : e,
                ),
            });
        },
    }),
    persistOptions: {
        partialize: (state) => ({
            exercises: state.exercises,
            seeded: state.seeded,
        }),
    },
});

export const selectExerciseById = (id: string | undefined) =>
    (state: ExercisesState): Exercise | undefined =>
        id ? state.exercises.find((e) => e.id === id) : undefined;
