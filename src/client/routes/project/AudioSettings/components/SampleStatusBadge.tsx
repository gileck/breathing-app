type Status = 'idle' | 'loading' | 'loaded' | 'missing';

type Props = {
    status: Status;
    // Show the loading pill even before the user has interacted with this
    // row, for cases where status can become 'missing' via a background
    // preload. When false, the badge is hidden while idle.
    showWhenIdle?: boolean;
};

/** Small "loading…" / "missing" pill shown next to an audio sample row. */
export function SampleStatusBadge({ status, showWhenIdle = false }: Props) {
    if (status === 'loaded') return null;
    if (status === 'idle' && !showWhenIdle) return null;
    if (status === 'loading') {
        return (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                loading…
            </span>
        );
    }
    if (status === 'missing') {
        return (
            <span className="font-mono text-[10px] uppercase tracking-wider text-destructive">
                missing
            </span>
        );
    }
    return null;
}
