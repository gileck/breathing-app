import { useEffect, useRef } from 'react';
import {
    useBackgroundMusicRuntimeStore,
    useBackgroundMusicStore,
} from './store';
import { loadYouTubeAPI } from './loader';
import type { YTPlayer } from './types';

/**
 * Hidden YouTube IFrame player. Mounted app-wide so the iframe + YT.Player
 * instance can be created ahead of time — starting a session then only
 * needs playVideo() which is near-instant, instead of the full cold-start
 * pipeline (script load → iframe creation → player construction).
 *
 * Playback is gated by:
 *   - `enabled` from persisted settings (user preference)
 *   - `shouldPlay` from the in-memory runtime store (set by the Session route)
 */
export function BackgroundMusicPlayer() {
    const enabled = useBackgroundMusicStore((s) => s.enabled);
    const volume = useBackgroundMusicStore((s) => s.volume);
    const videoId = useBackgroundMusicStore((s) => s.videoId);
    const shouldPlay = useBackgroundMusicRuntimeStore((s) => s.shouldPlay);

    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const readyRef = useRef(false);
    // Remember the last playback signal we acted on so we only seek-to-start
    // on actual play transitions — not on every render, and not a second
    // time when `onReady` fires while shouldPlay is already true.
    const prevShouldPlayRef = useRef(false);

    useEffect(() => {
        if (!enabled || !hostRef.current) return;
        let cancelled = false;

        loadYouTubeAPI().then((YT) => {
            if (cancelled || !hostRef.current) return;
            const target = document.createElement('div');
            hostRef.current.appendChild(target);
            const currentVolume = useBackgroundMusicStore.getState().volume;
            playerRef.current = new YT.Player(target, {
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    loop: 1,
                    playlist: videoId,
                },
                events: {
                    onReady: (event) => {
                        readyRef.current = true;
                        event.target.setVolume(Math.round(currentVolume * 100));
                        // If the session is already active by the time we become
                        // ready, start playing from the top.
                        if (useBackgroundMusicRuntimeStore.getState().shouldPlay) {
                            event.target.seekTo(0, true);
                            event.target.playVideo();
                            prevShouldPlayRef.current = true;
                        }
                    },
                },
            });
        }).catch(() => {
            /* network / embedding failure — player stays null */
        });

        return () => {
            cancelled = true;
            readyRef.current = false;
            const player = playerRef.current;
            playerRef.current = null;
            if (player) {
                try {
                    player.destroy();
                } catch {
                    /* already destroyed */
                }
            }
            if (hostRef.current) hostRef.current.innerHTML = '';
        };
    }, [enabled, videoId]);

    // Play / pause follows the runtime flag without tearing down the player.
    // We only seek-to-start when shouldPlay actually transitions false→true,
    // so onReady + this effect don't race into a double-seek.
    useEffect(() => {
        const player = playerRef.current;
        if (!player || !readyRef.current) return;
        const prev = prevShouldPlayRef.current;
        prevShouldPlayRef.current = shouldPlay;
        if (shouldPlay === prev) return;
        try {
            if (shouldPlay) {
                player.seekTo(0, true);
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        } catch {
            /* player no longer valid */
        }
    }, [shouldPlay]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player || !readyRef.current) return;
        try {
            player.setVolume(Math.round(volume * 100));
        } catch {
            /* player not ready */
        }
    }, [volume]);

    if (!enabled) return null;

    return (
        <div
            ref={hostRef}
            aria-hidden
            className="pointer-events-none fixed left-[-9999px] top-0 h-px w-px overflow-hidden"
        />
    );
}
