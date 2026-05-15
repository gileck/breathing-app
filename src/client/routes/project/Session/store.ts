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
