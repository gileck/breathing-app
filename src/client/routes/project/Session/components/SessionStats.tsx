type Stat = {
    label: string;
    value: string;
    highlight?: boolean;
};

type Props = {
    stats: Stat[];
};

export function SessionStats({ stats }: Props) {
    return (
        <div className="flex items-start justify-center gap-10">
            {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        {s.label}
                    </span>
                    <span
                        className={`tabular-nums text-sm ${
                            s.highlight ? 'text-primary' : 'text-foreground/85'
                        }`}
                    >
                        {s.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
