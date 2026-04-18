type Props = {
    scale: number;
    countdown: number;
};

export function BreathOrb({ scale, countdown }: Props) {
    const container = 240;
    const size = Math.max(0, Math.min(1, scale)) * container * 0.92;

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: container, height: container }}
        >
            <div
                className="breath-halo absolute rounded-full"
                style={{ width: container, height: container }}
                aria-hidden
            />
            <div
                className="breath-halo absolute rounded-full"
                style={{ width: container * 0.58, height: container * 0.58, opacity: 0.6 }}
                aria-hidden
            />
            <div
                className="breath-orb flex items-center justify-center rounded-full"
                style={{ width: size, height: size }}
            >
                {countdown > 0 && (
                    <span
                        className="font-light tabular-nums text-foreground"
                        style={{
                            fontSize: 72,
                            letterSpacing: '-0.04em',
                            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                        }}
                        aria-live="polite"
                    >
                        {countdown}
                    </span>
                )}
            </div>
        </div>
    );
}
