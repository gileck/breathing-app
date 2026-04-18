import { createStore } from '@/client/stores';
import type { Pattern, Phase, SessionLength } from '@/client/features/project/exercises';
import { clampPhaseValue } from '@/client/features/project/exercises';

export type EditorDraft = {
    exerciseId?: string;
    name: string;
    pattern: Pattern;
    pace: number;
    length: SessionLength;
    favorite: boolean;
};

type EditorState = {
    draft: EditorDraft | null;
    setDraft: (draft: EditorDraft) => void;
    clearDraft: () => void;
    setPhaseValue: (phase: Phase, value: number) => void;
    setName: (name: string) => void;
    setPace: (pace: number) => void;
    setFavorite: (favorite: boolean) => void;
};

export const useEditorStore = createStore<EditorState>({
    key: 'breathing-editor-draft',
    label: 'Breathing Editor Draft',
    inMemoryOnly: true,
    creator: (set, get) => ({
        draft: null,
        setDraft: (draft) => set({ draft }),
        clearDraft: () => set({ draft: null }),
        setPhaseValue: (phase, value) => {
            const current = get().draft;
            if (!current) return;
            set({
                draft: {
                    ...current,
                    pattern: { ...current.pattern, [phase]: clampPhaseValue(value) },
                },
            });
        },
        setName: (name) => {
            const current = get().draft;
            if (!current) return;
            set({ draft: { ...current, name } });
        },
        setPace: (pace) => {
            const current = get().draft;
            if (!current) return;
            set({ draft: { ...current, pace } });
        },
        setFavorite: (favorite) => {
            const current = get().draft;
            if (!current) return;
            set({ draft: { ...current, favorite } });
        },
    }),
});
