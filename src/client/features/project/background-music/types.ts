// Minimal YouTube IFrame Player API shape — we only need a handful of methods.
// Loaded lazily at runtime from https://www.youtube.com/iframe_api.

export type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

export type YTPlayer = {
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    getPlayerState: () => YTPlayerState;
    destroy: () => void;
};

export type YTPlayerVars = {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    loop?: 0 | 1;
    playlist?: string;
};

export type YTPlayerOptions = {
    videoId: string;
    playerVars?: YTPlayerVars;
    events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { data: YTPlayerState; target: YTPlayer }) => void;
        onError?: (event: { data: number; target: YTPlayer }) => void;
    };
};

export type YTNamespace = {
    Player: new (el: string | HTMLElement, opts: YTPlayerOptions) => YTPlayer;
};

export type WindowWithYT = Window & {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
};
