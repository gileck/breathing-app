import type { WindowWithYT, YTNamespace } from './types';

let apiPromise: Promise<YTNamespace> | null = null;

export const loadYouTubeAPI = (): Promise<YTNamespace> => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('no window'));
    }
    const w = window as WindowWithYT;
    if (w.YT?.Player) return Promise.resolve(w.YT);
    if (apiPromise) return apiPromise;

    apiPromise = new Promise<YTNamespace>((resolve, reject) => {
        // Chain onto any existing handler rather than clobber it.
        const previous = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = () => {
            if (previous) {
                try {
                    previous();
                } catch {
                    /* swallow */
                }
            }
            if (w.YT?.Player) resolve(w.YT);
            else reject(new Error('YouTube API loaded but YT.Player is missing'));
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
        document.head.appendChild(script);
    }).catch((err) => {
        // Reset so a later toggle-off-then-on (or a retry after the network
        // recovers) can attempt loading again instead of resolving the same
        // failed promise forever.
        apiPromise = null;
        throw err;
    });

    return apiPromise;
};
