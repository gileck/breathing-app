import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Trash2, Star } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { ConfirmDialog } from '@/client/components/template/ui/confirm-dialog';
import { Switch } from '@/client/components/template/ui/switch';
import { Label } from '@/client/components/template/ui/label';
import { useRouter } from '@/client/features';
import {
    useExercisesStore,
    selectExerciseById,
    breathsPerMinute,
    patternString,
    isPatternValid,
    PHASE_COLOR_VAR,
    type Phase,
} from '@/client/features/project/exercises';
import { ensureAudio } from '@/client/features/project/breathing-audio';
import { TimelineBar } from '../Library/components/TimelineBar';
import { PhaseStepper } from './components/PhaseStepper';
import { SaveSheet } from './components/SaveSheet';
import { useEditorStore, type EditorDraft } from './store';

const DEFAULT_DRAFT: EditorDraft = {
    name: '',
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    pace: 1,
    length: { kind: 'minutes', value: 5 },
    favorite: false,
    meditation: false,
};

const PHASE_ROWS: Array<{ phase: Phase; label: string }> = [
    { phase: 'inhale', label: 'Inhale' },
    { phase: 'holdIn', label: 'Hold in' },
    { phase: 'exhale', label: 'Exhale' },
    { phase: 'holdOut', label: 'Hold out' },
];

export function ExerciseEditor() {
    const { navigate, routeParams } = useRouter();
    const editingId = routeParams.id;

    const existing = useExercisesStore(selectExerciseById(editingId));
    const addExercise = useExercisesStore((s) => s.addExercise);
    const updateExercise = useExercisesStore((s) => s.updateExercise);
    const deleteExercise = useExercisesStore((s) => s.deleteExercise);

    const draft = useEditorStore((s) => s.draft);
    const setDraft = useEditorStore((s) => s.setDraft);
    const setPhaseValue = useEditorStore((s) => s.setPhaseValue);
    const setPace = useEditorStore((s) => s.setPace);
    const setFavorite = useEditorStore((s) => s.setFavorite);
    const setMeditation = useEditorStore((s) => s.setMeditation);
    const clearDraft = useEditorStore((s) => s.clearDraft);

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral dialog state
    const [saveOpen, setSaveOpen] = useState(false);
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral confirm dialog
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => {
        if (editingId && existing) {
            setDraft({
                exerciseId: existing.id,
                name: existing.name,
                pattern: existing.pattern,
                pace: existing.pace,
                length: existing.length,
                favorite: existing.favorite,
                meditation: existing.meditation ?? false,
            });
        } else if (!editingId) {
            setDraft({ ...DEFAULT_DRAFT });
        }
    }, [editingId, existing, setDraft]);

    useEffect(() => {
        return () => clearDraft();
    }, [clearDraft]);

    if (!draft) {
        return null;
    }

    if (editingId && !existing) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8 text-center">
                <p className="mb-4 text-muted-foreground">Exercise not found.</p>
                <Button onClick={() => navigate('/')}>Back to library</Button>
            </div>
        );
    }

    const valid = isPatternValid(draft.pattern);
    const isEditing = Boolean(editingId && existing);

    const commit = (name: string) => {
        if (!valid || name.trim().length === 0) return;
        if (isEditing && existing) {
            updateExercise(existing.id, {
                name: name.trim(),
                pattern: draft.pattern,
                pace: draft.pace,
                length: draft.length,
                favorite: draft.favorite,
                meditation: draft.meditation,
            });
        } else {
            addExercise({
                name: name.trim(),
                pattern: draft.pattern,
                pace: draft.pace,
                length: draft.length,
                favorite: draft.favorite,
                meditation: draft.meditation,
            });
        }
        setSaveOpen(false);
        navigate('/');
    };

    const startSession = () => {
        if (!valid) return;
        // Unlock WebAudio inside the click handler so iOS PWAs allow sound in the session.
        void ensureAudio();
        if (isEditing && existing) {
            navigate(`/session/${existing.id}`);
            return;
        }
        const created = addExercise({
            name: draft.name.trim() || 'Untitled',
            pattern: draft.pattern,
            pace: draft.pace,
            length: draft.length,
            favorite: draft.favorite,
            meditation: draft.meditation,
        });
        navigate(`/session/${created.id}`);
    };

    const confirmDelete = () => {
        if (!existing) return;
        deleteExercise(existing.id);
        setDeleteOpen(false);
        navigate('/');
    };

    return (
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate('/')}
                        aria-label="Back to library"
                        className="h-11 w-11"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                    </Button>
                    <h1 className="text-xl font-semibold tracking-tight">
                        {isEditing ? 'Edit exercise' : 'Pattern Builder'}
                    </h1>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setFavorite(!draft.favorite)}
                        aria-label={draft.favorite ? 'Unpin' : 'Pin'}
                        aria-pressed={draft.favorite}
                        className="h-11 w-11"
                    >
                        <Star
                            className={`h-5 w-5 ${draft.favorite ? 'fill-primary text-primary' : ''}`}
                        />
                    </Button>
                    {isEditing && (
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
                    )}
                </div>
            </div>

            <div className="mb-8 rounded-2xl border bg-card p-6 text-center">
                <div className="font-mono tabular-nums text-5xl font-light leading-none">
                    {breathsPerMinute(draft.pattern, draft.pace)}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    breaths / min
                </div>
                <TimelineBar
                    pattern={draft.pattern}
                    className="mx-auto mt-4 max-w-xs"
                />
                <div className="mt-3 font-mono text-xs text-muted-foreground">
                    {patternString(draft.pattern)}
                </div>
            </div>

            <div className="mb-8 flex flex-col gap-2">
                {PHASE_ROWS.map(({ phase, label }) => (
                    <PhaseStepper
                        key={phase}
                        phase={phase}
                        label={label}
                        value={draft.pattern[phase]}
                        cssVar={PHASE_COLOR_VAR[phase]}
                        onChange={(v) => setPhaseValue(phase, v)}
                    />
                ))}
            </div>

            <div className="mb-8 rounded-2xl border bg-card p-4">
                <div className="mb-3 flex items-baseline justify-between">
                    <div className="text-sm font-medium">Pace</div>
                    <div className="font-mono text-sm tabular-nums">
                        {draft.pace.toFixed(2)}×
                    </div>
                </div>
                <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={draft.pace}
                    onChange={(e) => setPace(parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    aria-label="Pace multiplier"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>0.5×</span>
                    <span>1×</span>
                    <span>2×</span>
                </div>
            </div>

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
                        checked={draft.meditation ?? false}
                        onCheckedChange={setMeditation}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveOpen(true)}
                    disabled={!valid}
                    className="h-12 flex-1 rounded-xl"
                >
                    {isEditing ? 'Save changes' : 'Save'}
                </Button>
                <Button
                    type="button"
                    onClick={startSession}
                    disabled={!valid}
                    className="h-12 flex-[2] rounded-xl"
                >
                    <Play className="mr-2 h-4 w-4" aria-hidden />
                    Start session
                </Button>
            </div>

            <SaveSheet
                open={saveOpen}
                onOpenChange={setSaveOpen}
                pattern={draft.pattern}
                pace={draft.pace}
                initialName={draft.name || existing?.name}
                onSave={commit}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete exercise?"
                description={`"${existing?.name}" will be removed. This cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
