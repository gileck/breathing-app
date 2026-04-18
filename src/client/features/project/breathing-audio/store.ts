import { createStore } from '@/client/stores';
import type { Phase } from '@/client/features/project/exercises';
import type { AudioCueStyle, AudioSettings, PhaseCues } from './types';
import { DEFAULT_PHASE_CUES } from './types';

type AudioSettingsState = AudioSettings & {
    setEnabled: (enabled: boolean) => void;
    toggleEnabled: () => void;
    setVolume: (volume: number) => void;
    setStyle: (style: AudioCueStyle) => void;
    setPhaseCue: (phase: Phase, enabled: boolean) => void;
    togglePhaseCue: (phase: Phase) => void;
    resetCues: () => void;
};

export const useAudioSettingsStore = createStore<AudioSettingsState>({
    key: 'breathing-audio-settings',
    label: 'Breathing Audio Settings',
    creator: (set, get) => ({
        enabled: true,
        volume: 0.3,
        style: 'tones',
        cues: DEFAULT_PHASE_CUES,
        setEnabled: (enabled) => set({ enabled }),
        toggleEnabled: () => set({ enabled: !get().enabled }),
        setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
        setStyle: (style) => set({ style }),
        setPhaseCue: (phase, enabled) =>
            set({ cues: { ...get().cues, [phase]: enabled } }),
        togglePhaseCue: (phase) => {
            const current = get().cues;
            set({ cues: { ...current, [phase]: !current[phase] } });
        },
        resetCues: () => set({ cues: DEFAULT_PHASE_CUES }),
    }),
    persistOptions: {
        partialize: (state) => ({
            enabled: state.enabled,
            volume: state.volume,
            style: state.style,
            cues: state.cues,
        }),
        // Merge persisted state with current defaults so newly added cue keys
        // (e.g., after an update) are filled in with sensible defaults.
        merge: (persisted, current) => {
            const p = (persisted ?? {}) as Partial<AudioSettings>;
            return {
                ...current,
                ...p,
                cues: { ...DEFAULT_PHASE_CUES, ...(p.cues as Partial<PhaseCues> | undefined) },
            };
        },
    },
});
