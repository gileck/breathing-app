import { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/client/components/template/ui/button';
import { Switch } from '@/client/components/template/ui/switch';
import { Label } from '@/client/components/template/ui/label';
import { useRouter } from '@/client/features';
import { PHASES, type Phase } from '@/client/features/project/exercises';
import {
    AUDIO_CUE_STYLES,
    ensureAudio,
    getSampleStatus,
    playPhaseCue,
    playVoiceCue,
    preloadSampleForStyle,
    preloadVoiceSamples,
    setMasterVolume,
    useAudioSettingsStore,
    VOICE_SAMPLE_IDS,
    type AudioCueStyle,
    type SampleId,
} from '@/client/features/project/breathing-audio';
import { useBackgroundMusicStore } from '@/client/features/project/background-music';
import { SampleStatusBadge } from './components/SampleStatusBadge';

const PHASE_META: Record<Phase, { label: string; description: string }> = {
    inhale: { label: 'Inhale', description: 'Rising tone when breathing in' },
    holdIn: { label: 'Hold in', description: 'Short chime at top of breath' },
    exhale: { label: 'Exhale', description: 'Falling tone when breathing out' },
    holdOut: { label: 'Rest', description: 'Short chime between breaths' },
};

export function AudioSettings() {
    const { navigate } = useRouter();
    const enabled = useAudioSettingsStore((s) => s.enabled);
    const volume = useAudioSettingsStore((s) => s.volume);
    const style = useAudioSettingsStore((s) => s.style);
    const cues = useAudioSettingsStore((s) => s.cues);
    const voice = useAudioSettingsStore((s) => s.voice);
    const setEnabled = useAudioSettingsStore((s) => s.setEnabled);
    const setVolume = useAudioSettingsStore((s) => s.setVolume);
    const setStyle = useAudioSettingsStore((s) => s.setStyle);
    const setPhaseCue = useAudioSettingsStore((s) => s.setPhaseCue);
    const resetCues = useAudioSettingsStore((s) => s.resetCues);
    const setVoice = useAudioSettingsStore((s) => s.setVoice);

    const bgEnabled = useBackgroundMusicStore((s) => s.enabled);
    const bgVolume = useBackgroundMusicStore((s) => s.volume);
    const setBgEnabled = useBackgroundMusicStore((s) => s.setEnabled);
    const setBgVolume = useBackgroundMusicStore((s) => s.setVolume);

    const handleVolume = (value: number) => {
        setVolume(value);
        setMasterVolume(value);
    };

    // Track sample load state so we can show "missing" / "loaded" badges and
    // keep the UI responsive after a picked style finishes downloading.
    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral UI state derived from async loader
    const [sampleTick, setSampleTick] = useState(0);
    const sampleStatusFor = (id: SampleId) => {
        void sampleTick;
        return getSampleStatus(id);
    };

    const voiceStatus: 'idle' | 'loading' | 'loaded' | 'missing' = (() => {
        void sampleTick;
        const statuses = VOICE_SAMPLE_IDS.map(getSampleStatus);
        if (statuses.includes('missing')) return 'missing';
        if (statuses.every((s) => s === 'loaded')) return 'loaded';
        if (statuses.includes('loading')) return 'loading';
        return 'idle';
    })();

    // Intentionally NOT calling ensureAudio() on mount — creating an
    // AudioContext without a user gesture leaves it in a compromised state
    // that can silently break AudioBufferSourceNode playback on Chrome.
    // The context is unlocked on the first click instead.

    const handleTest = async (phase: Phase, overrideStyle?: AudioCueStyle) => {
        const ok = await ensureAudio();
        if (!ok) return;
        const current = useAudioSettingsStore.getState();
        setMasterVolume(current.volume);
        const effectiveStyle = overrideStyle ?? current.style;
        if (effectiveStyle === 'silent') return;

        // Warm the other recorded sample in the background so the picker's
        // "missing" badge becomes accurate even when the user hasn't
        // auditioned it yet.
        for (const other of ['gong', 'bowl'] as const) {
            if (other !== effectiveStyle) {
                void preloadSampleForStyle(other).then(() =>
                    setSampleTick((n) => n + 1),
                );
            }
        }

        await preloadSampleForStyle(effectiveStyle);
        setSampleTick((n) => n + 1);
        playPhaseCue(phase, effectiveStyle);
    };

    const handleStyleChange = (next: AudioCueStyle) => {
        setStyle(next);
        void handleTest('inhale', next);
    };

    const handleVoiceChange = (next: boolean) => {
        setVoice(next);
        if (!next) return;
        void ensureAudio().then(async (ok) => {
            if (!ok) return;
            setMasterVolume(useAudioSettingsStore.getState().volume);
            await preloadVoiceSamples();
            setSampleTick((n) => n + 1);
            playVoiceCue('inhale');
        });
    };

    return (
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
            <div className="mb-6 flex items-center gap-2">
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
                <h1 className="text-xl font-semibold tracking-tight">Audio</h1>
            </div>

            <section className="mb-6 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Label htmlFor="audio-enabled" className="text-base font-medium">
                            Sound during session
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Play cues at phase transitions so you can practice eyes-closed.
                        </p>
                    </div>
                    <Switch
                        id="audio-enabled"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                    />
                </div>
            </section>

            <section className={`mb-6 rounded-2xl border bg-card p-4 transition-opacity ${enabled ? '' : 'opacity-50'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="audio-voice" className="text-base font-medium">
                                Human voice
                            </Label>
                            {voice && <SampleStatusBadge status={voiceStatus} />}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {voice && voiceStatus === 'missing'
                                ? 'Voice files not found in public/audio/voice/. No voice will play.'
                                : 'Speaks "inhale", "hold", or "exhale" on each phase instead of the cue style.'}
                        </p>
                    </div>
                    <Switch
                        id="audio-voice"
                        checked={voice}
                        onCheckedChange={handleVoiceChange}
                        disabled={!enabled}
                    />
                </div>
            </section>

            <section className={`mb-6 rounded-2xl border bg-card p-4 transition-opacity ${enabled && !voice ? '' : 'opacity-50'}`}>
                <div className="mb-1">
                    <h2 className="text-base font-medium">Sound style</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        What you hear on each phase transition. Tap one to preview.
                    </p>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                    {AUDIO_CUE_STYLES.map((option) => {
                        const active = option.value === style;
                        const sampleStatus = option.sample
                            ? sampleStatusFor(option.sample)
                            : null;
                        const sampleMissing = sampleStatus === 'missing';
                        return (
                            <li key={option.value}>
                                <button
                                    type="button"
                                    onClick={() => handleStyleChange(option.value)}
                                    disabled={!enabled || voice}
                                    aria-pressed={active}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                                        active
                                            ? 'border-primary/70 bg-primary/10'
                                            : 'border-border bg-background hover:bg-accent/40'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {option.label}
                                            </span>
                                            {sampleStatus !== null && (
                                                <SampleStatusBadge status={sampleStatus} />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {sampleMissing
                                                ? 'Sample file not found in public/audio. No sound will play for this style.'
                                                : option.description}
                                        </div>
                                    </div>
                                    <div
                                        aria-hidden
                                        className={`h-3.5 w-3.5 rounded-full border ${
                                            active
                                                ? 'border-primary bg-primary'
                                                : 'border-border'
                                        }`}
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className={`mb-6 rounded-2xl border bg-card p-4 transition-opacity ${enabled ? '' : 'opacity-50'}`}>
                <div className="mb-3 flex items-baseline justify-between">
                    <Label htmlFor="audio-volume" className="text-base font-medium">
                        Volume
                    </Label>
                    <span className="font-mono text-sm tabular-nums">
                        {Math.round(volume * 100)}%
                    </span>
                </div>
                <input
                    id="audio-volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleVolume(parseFloat(e.target.value))}
                    disabled={!enabled}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed"
                    aria-label="Volume"
                />
            </section>

            <section className="mb-6 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Label htmlFor="bg-music" className="text-base font-medium">
                            Background music
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Plays a meditation track from YouTube during the session.
                            Streams over the network; works only while online.
                        </p>
                    </div>
                    <Switch
                        id="bg-music"
                        checked={bgEnabled}
                        onCheckedChange={setBgEnabled}
                    />
                </div>
                <div className={`mt-4 transition-opacity ${bgEnabled ? '' : 'opacity-50'}`}>
                    <div className="mb-2 flex items-baseline justify-between">
                        <Label htmlFor="bg-volume" className="text-sm font-medium">
                            Music volume
                        </Label>
                        <span className="font-mono text-sm tabular-nums">
                            {Math.round(bgVolume * 100)}%
                        </span>
                    </div>
                    <input
                        id="bg-volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={bgVolume}
                        onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                        disabled={!bgEnabled}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed"
                        aria-label="Background music volume"
                    />
                </div>
            </section>

            <section className={`rounded-2xl border bg-card p-4 transition-opacity ${enabled ? '' : 'opacity-50'}`}>
                <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-medium">Per-phase cues</h2>
                    <button
                        type="button"
                        onClick={resetCues}
                        className="min-h-11 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Reset
                    </button>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                    Turn off a phase if its cue distracts you.
                </p>
                <ul className="flex flex-col divide-y">
                    {PHASES.map((phase) => {
                        const meta = PHASE_META[phase];
                        const active = cues[phase];
                        return (
                            <li key={phase} className="flex items-center gap-3 py-3">
                                <div className="flex-1">
                                    <Label
                                        htmlFor={`cue-${phase}`}
                                        className="text-sm font-medium"
                                    >
                                        {meta.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {meta.description}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleTest(phase)}
                                    disabled={!enabled || !active}
                                    aria-label={`Test ${meta.label} cue`}
                                    className="h-11 w-11"
                                >
                                    <Play className="h-4 w-4" aria-hidden />
                                </Button>
                                <Switch
                                    id={`cue-${phase}`}
                                    checked={active}
                                    onCheckedChange={(v) => setPhaseCue(phase, v)}
                                />
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
