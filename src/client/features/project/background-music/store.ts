import { createStore } from '@/client/stores';

type BackgroundMusicState = {
    enabled: boolean;
    volume: number;
    videoId: string;
    setEnabled: (enabled: boolean) => void;
    toggleEnabled: () => void;
    setVolume: (volume: number) => void;
    setVideoId: (videoId: string) => void;
};

// Hard-coded for v1. A later iteration can expose a URL/picker UI.
const DEFAULT_VIDEO_ID = '1ZYbU82GVz4';

export const useBackgroundMusicStore = createStore<BackgroundMusicState>({
    key: 'background-music-settings',
    label: 'Background Music',
    creator: (set, get) => ({
        enabled: false,
        volume: 0.3,
        videoId: DEFAULT_VIDEO_ID,
        setEnabled: (enabled) => set({ enabled }),
        toggleEnabled: () => set({ enabled: !get().enabled }),
        setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
        setVideoId: (videoId) => set({ videoId }),
    }),
    persistOptions: {
        partialize: (state) => ({
            enabled: state.enabled,
            volume: state.volume,
            videoId: state.videoId,
        }),
    },
});

/**
 * Runtime-only "is a session currently requesting playback" flag. Kept
 * separate from persisted settings because it should reset on reload
 * and reflect only the current in-app navigation state.
 */
type BackgroundMusicRuntimeState = {
    shouldPlay: boolean;
    setShouldPlay: (shouldPlay: boolean) => void;
};

export const useBackgroundMusicRuntimeStore = createStore<BackgroundMusicRuntimeState>({
    key: 'background-music-runtime',
    label: 'Background Music Runtime',
    inMemoryOnly: true,
    creator: (set) => ({
        shouldPlay: false,
        setShouldPlay: (shouldPlay) => set({ shouldPlay }),
    }),
});
