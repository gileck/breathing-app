import { useEffect, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/client/components/template/ui/sheet';
import { Input } from '@/client/components/template/ui/input';
import { Label } from '@/client/components/template/ui/label';
import { Button } from '@/client/components/template/ui/button';
import type { Pattern } from '@/client/features/project/exercises';
import { breathsPerMinute, patternString } from '@/client/features/project/exercises';

const PRESET_NAMES = ['Morning', 'Pre-sleep', 'Focus', 'Anxiety reset'] as const;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pattern: Pattern;
    pace: number;
    initialName?: string;
    onSave: (name: string) => void;
};

export function SaveSheet({
    open,
    onOpenChange,
    pattern,
    pace,
    initialName,
    onSave,
}: Props) {
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral text input (valid useState case)
    const [name, setName] = useState(initialName ?? '');

    useEffect(() => {
        if (open) setName(initialName ?? '');
    }, [open, initialName]);

    const trimmed = name.trim();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="rounded-t-3xl border-x-0 border-b-0 p-6 pb-10"
            >
                <SheetHeader>
                    <SheetTitle>Save exercise</SheetTitle>
                    <p className="font-mono text-xs text-muted-foreground">
                        {patternString(pattern)} · {breathsPerMinute(pattern, pace)} bpm
                    </p>
                </SheetHeader>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="exercise-name">Name</Label>
                        <Input
                            id="exercise-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Exercise name"
                            autoFocus
                            className="h-12"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {PRESET_NAMES.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setName(preset)}
                                className={`min-h-11 rounded-full border px-3 text-sm transition-colors ${
                                    trimmed === preset
                                        ? 'border-primary bg-primary/15 text-foreground'
                                        : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-12 flex-1 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={trimmed.length === 0}
                            onClick={() => onSave(trimmed)}
                            className="h-12 flex-[2] rounded-xl"
                        >
                            Save exercise
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
