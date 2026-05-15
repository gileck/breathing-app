import { createStore } from '@/client/stores';

type EndlessSessionState = {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    toggleEnabled: () => void;
};

/**
 * When enabled, the session ignores the exercise's target cycles / minutes
 * and keeps cycling indefinitely until the user ends the session manually.
 * Persisted so the preference survives reloads; defaults to off.
 */
export const useEndlessSessionStore = createStore<EndlessSessionState>({
    key: 'session-endless',
    label: 'Session Endless Mode',
    creator: (set, get) => ({
        enabled: false,
        setEnabled: (enabled) => set({ enabled }),
        toggleEnabled: () => set({ enabled: !get().enabled }),
    }),
    persistOptions: {
        partialize: (state) => ({ enabled: state.enabled }),
    },
});

/**
 * Per-session overrides set from the in-exercise config dialog. NOT persisted —
 * resets every time a new Session mounts so the underlying saved exercise is
 * never mutated.
 *
 * - `targetCyclesOverride`: when non-null, replaces the exercise's target cycle
 *   count for end-of-session detection.
 */
type SessionOverridesState = {
    targetCyclesOverride: number | null;
    setTargetCyclesOverride: (cycles: number | null) => void;
    reset: () => void;
};

export const useSessionOverridesStore = createStore<SessionOverridesState>({
    key: 'session-overrides',
    label: 'Session Overrides',
    inMemoryOnly: true,
    creator: (set) => ({
        targetCyclesOverride: null,
        setTargetCyclesOverride: (cycles) => set({ targetCyclesOverride: cycles }),
        reset: () => set({ targetCyclesOverride: null }),
    }),
});
