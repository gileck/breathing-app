import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Trash2, Star, Minus, Plus, Pencil } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { ConfirmDialog } from '@/client/components/template/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/client/components/template/ui/dialog';
import { Input } from '@/client/components/template/ui/input';
import { Label } from '@/client/components/template/ui/label';
import { Switch } from '@/client/components/template/ui/switch';
import { useRouter } from '@/client/features';
import {
    useExercisesStore,
    selectExerciseById,
    breathsPerMinute,
    patternString,
    isPatternValid,
    PHASE_COLOR_VAR,
    estimatedDurationSeconds,
    formatClockDuration,
    totalSeconds,
    type Exercise,
    type Pattern,
    type Phase,
    type SessionLength,
} from '@/client/features/project/exercises';
import { ensureAudio } from '@/client/features/project/breathing-audio';
import { TimelineBar } from '../Library/components/TimelineBar';
import { PhaseStepper } from './components/PhaseStepper';

const DEFAULT_PATTERN: Pattern = { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 };
const DEFAULT_LENGTH: SessionLength = { kind: 'cycles', value: 12 };

const PHASE_ROWS: Array<{ phase: Phase; label: string }> = [
    { phase: 'inhale', label: 'Inhale' },
    { phase: 'holdIn', label: 'Hold in' },
    { phase: 'exhale', label: 'Exhale' },
    { phase: 'holdOut', label: 'Hold out' },
];

// Legacy minute-based lengths get converted to equivalent cycles on edit so
// sessions always end on a clean cycle boundary.
const normalizeLength = (exercise: Exercise): SessionLength => {
    if (exercise.length.kind === 'cycles') return exercise.length;
    if (exercise.length.kind === 'minutes') {
        const cycleSec = totalSeconds(exercise.pattern);
        const cycles =
            cycleSec > 0
                ? Math.max(1, Math.round((exercise.length.value * 60) / cycleSec))
                : 12;
        return { kind: 'cycles', value: cycles };
    }
    return { kind: 'cycles', value: 12 };
};

export function ExerciseEditor() {
    const { navigate, routeParams } = useRouter();
    const editingId = routeParams.id;

    const existing = useExercisesStore(selectExerciseById(editingId));
    const addExercise = useExercisesStore((s) => s.addExercise);
    const updateExercise = useExercisesStore((s) => s.updateExercise);
    const deleteExercise = useExercisesStore((s) => s.deleteExercise);

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral confirm dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral dialog open state for rename
    const [renameOpen, setRenameOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral text input (valid useState case)
    const [nameDraft, setNameDraft] = useState('');

    // /exercise/new path: create a fresh record immediately and redirect to
    // its edit URL so every later change has a real persisted exercise to
    // auto-save against.
    useEffect(() => {
        if (editingId) return;
        const created = addExercise({
            name: 'Untitled',
            pattern: { ...DEFAULT_PATTERN },
            length: { ...DEFAULT_LENGTH },
            favorite: false,
            meditation: false,
        });
        navigate(`/exercise/${created.id}`, { replace: true });
    }, [editingId, addExercise, navigate]);

    // Silently migrate legacy minutes-based length to cycles the first time
    // a pre-migration exercise is opened.
    useEffect(() => {
        if (!existing) return;
        if (existing.length.kind === 'minutes') {
            updateExercise(existing.id, { length: normalizeLength(existing) });
        }
    }, [existing, updateExercise]);

    if (!editingId) return null;
    if (!existing) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8 text-center">
                <p className="mb-4 text-muted-foreground">Exercise not found.</p>
                <Button onClick={() => navigate('/')}>Back to library</Button>
            </div>
        );
    }

    const valid = isPatternValid(existing.pattern);

    const setPhaseValue = (phase: Phase, value: number) =>
        updateExercise(existing.id, {
            pattern: {
                ...existing.pattern,
                [phase]: Math.max(0, Math.min(30, Math.round(value))),
            },
        });

    const setLength = (length: SessionLength) => updateExercise(existing.id, { length });
    const setFavorite = (favorite: boolean) =>
        updateExercise(existing.id, { favorite });
    const setMeditation = (meditation: boolean) =>
        updateExercise(existing.id, { meditation });

    const commitName = () => {
        const trimmed = nameDraft.trim();
        updateExercise(existing.id, { name: trimmed.length > 0 ? trimmed : 'Untitled' });
        setRenameOpen(false);
    };

    const openRename = () => {
        setNameDraft(existing.name);
        setRenameOpen(true);
    };

    const startSession = () => {
        if (!valid) return;
        void ensureAudio();
        navigate(`/session/${existing.id}`);
    };

    const confirmDelete = () => {
        deleteExercise(existing.id);
        setDeleteOpen(false);
        navigate('/');
    };

    return (
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate('/')}
                        aria-label="Back to library"
                        className="h-11 w-11 flex-shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                    </Button>
                    <button
                        type="button"
                        onClick={openRename}
                        className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left hover:bg-accent/40"
                    >
                        <h1 className="truncate text-xl font-semibold tracking-tight">
                            {existing.name}
                        </h1>
                        <Pencil className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setFavorite(!existing.favorite)}
                        aria-label={existing.favorite ? 'Unfavorite' : 'Favorite'}
                        aria-pressed={existing.favorite}
                        className="h-11 w-11"
                    >
                        <Star
                            className={`h-5 w-5 ${existing.favorite ? 'fill-primary text-primary' : ''}`}
                        />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteOpen(true)}
                        aria-label="Delete exercise"
                        className="h-11 w-11 text-destructive"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="mb-8 rounded-2xl border bg-card p-6 text-center">
                <div className="font-mono tabular-nums text-5xl font-light leading-none">
                    {breathsPerMinute(existing.pattern)}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    breaths / min
                </div>
                <TimelineBar pattern={existing.pattern} className="mx-auto mt-4 max-w-xs" />
                <div className="mt-3 font-mono text-xs text-muted-foreground">
                    {patternString(existing.pattern)}
                </div>
            </div>

            <div className="mb-8 flex flex-col gap-2">
                {PHASE_ROWS.map(({ phase, label }) => (
                    <PhaseStepper
                        key={phase}
                        phase={phase}
                        label={label}
                        value={existing.pattern[phase]}
                        cssVar={PHASE_COLOR_VAR[phase]}
                        onChange={(v) => setPhaseValue(phase, v)}
                    />
                ))}
            </div>

            {(() => {
                const cycles = existing.length.kind === 'cycles' ? existing.length.value : 12;
                const minCycles = 1;
                const maxCycles = 200;
                const adjust = (delta: number) => {
                    const next = Math.max(minCycles, Math.min(maxCycles, cycles + delta));
                    setLength({ kind: 'cycles', value: next });
                };
                const estimatedSec = estimatedDurationSeconds(
                    existing.pattern,
                    1,
                    { kind: 'cycles', value: cycles },
                );
                return (
                    <div className="mb-8 rounded-2xl border bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-base font-medium">Length</div>
                                <div className="text-sm text-muted-foreground">
                                    Total cycles
                                </div>
                            </div>
                            <div className="flex items-stretch overflow-hidden rounded-xl border">
                                <button
                                    type="button"
                                    onClick={() => adjust(-1)}
                                    disabled={cycles <= minCycles}
                                    aria-label="Decrease cycles"
                                    className="flex min-h-11 w-11 items-center justify-center bg-muted/40 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                >
                                    <Minus className="h-4 w-4" aria-hidden />
                                </button>
                                <div
                                    aria-live="polite"
                                    className="flex min-h-11 w-16 items-center justify-center border-x bg-background font-mono text-lg tabular-nums"
                                >
                                    {cycles}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => adjust(1)}
                                    disabled={cycles >= maxCycles}
                                    aria-label="Increase cycles"
                                    className="flex min-h-11 w-11 items-center justify-center bg-muted/40 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                </button>
                            </div>
                        </div>
                        {estimatedSec !== null && estimatedSec > 0 && (
                            <div className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
                                Session lasts about{' '}
                                <span className="font-medium text-foreground/80">
                                    {formatClockDuration(estimatedSec)}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })()}

            <div className="mb-8 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Label htmlFor="exercise-meditation" className="text-base font-medium">
                            Start with meditation
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Play a short guided intro to settle in before the breathing pattern begins.
                        </p>
                    </div>
                    <Switch
                        id="exercise-meditation"
                        checked={existing.meditation ?? false}
                        onCheckedChange={setMeditation}
                    />
                </div>
            </div>

            <Button
                type="button"
                onClick={startSession}
                disabled={!valid}
                className="h-12 w-full rounded-xl"
            >
                <Play className="mr-2 h-4 w-4" aria-hidden />
                Start session
            </Button>

            <Dialog
                open={renameOpen}
                onOpenChange={(open) => {
                    setRenameOpen(open);
                    if (!open) setNameDraft('');
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename exercise</DialogTitle>
                    </DialogHeader>
                    <Input
                        autoFocus
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitName();
                        }}
                        placeholder="Exercise name"
                        className="h-12"
                    />
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRenameOpen(false)}
                            className="h-11 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={commitName}
                            className="h-11 rounded-xl"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete exercise?"
                description={`"${existing.name}" will be removed. This cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
