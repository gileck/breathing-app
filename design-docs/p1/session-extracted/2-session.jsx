// Breathing app — Session screen mockup
// ─────────────────────────────────────────────────────────────

const PATTERN_BASE = { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 };

function SessionScreen({ shape = 'orb', phase = 'inhale', tempo = 1, showTuner = true, showNudge = false, onTempoChange }) {
  // Derived values based on which phase is active
  const phaseLabels = {
    inhale: 'Breathe in',
    holdIn: 'Hold',
    exhale: 'Breathe out',
    holdOut: 'Rest',
  };
  const phaseDur = {
    inhale: Math.round(PATTERN_BASE.inhale * tempo),
    holdIn: Math.round(PATTERN_BASE.holdIn * tempo),
    exhale: Math.round(PATTERN_BASE.exhale * tempo),
    holdOut: Math.round(PATTERN_BASE.holdOut * tempo),
  };
  const totalCycle = phaseDur.inhale + phaseDur.holdIn + phaseDur.exhale + phaseDur.holdOut;
  const bpm = totalCycle > 0 ? (60 / totalCycle).toFixed(1) : '—';

  // Shape scale per phase
  const shapeScale = {
    inhale: 1.0,
    holdIn: 1.0,
    exhale: 0.55,
    holdOut: 0.55,
  }[phase];

  // Countdown in-shape (frozen snapshot — show mid-phase for "alive" feel)
  const countdown = {
    inhale: 2,
    holdIn: 4,
    exhale: 5,
    holdOut: 0,
  }[phase];

  // Active phase highlighting — inhale visually stretched, exhale compressed
  const isActive = (k) => k === phase;

  const W = 402;

  return (
    <IOSDevice width={W} height={874} dark={true}>
      {/* Full-bleed dark session background with subtle radial breathing haze */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 55% at 50% 44%, oklch(0.26 0.04 230 / 0.55), oklch(0.14 0.008 60) 70%)`,
        zIndex: 0,
      }} />

      {/* Top row: cycle count + pattern readout + close */}
      <div style={{
        position: 'absolute', top: 62, left: 0, right: 0,
        padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 5,
      }}>
        {/* Cycle counter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'oklch(0.55 0.01 80)',
          }}>Cycle</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 15, color: 'oklch(0.85 0.01 80)',
            fontVariantNumeric: 'tabular-nums',
          }}>07 <span style={{ color: 'oklch(0.45 0.01 80)' }}>/ 24</span></div>
        </div>

        {/* Close X (tap-to-reveal in real app; shown here dim) */}
        <button style={{
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ═══════ Shape ═══════ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <BreathShape shape={shape} scale={shapeScale} phase={phase} countdown={countdown} />
      </div>

      {/* ═══════ Phase label (above shape) ═══════ */}
      <div style={{
        position: 'absolute', top: 182, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        zIndex: 3,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'oklch(0.60 0.04 230)',
        }}>4 · 7 · 8 · 0</div>
        <div style={{
          fontSize: 28, fontWeight: 300, letterSpacing: '-0.01em',
          color: 'oklch(0.96 0.005 80)',
        }}>{phaseLabels[phase]}{phase === 'inhale' || phase === 'exhale' ? '…' : ''}</div>
      </div>

      {/* ═══════ Per-phase tappable row (below shape) ═══════ */}
      <div style={{
        position: 'absolute', bottom: 180, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        zIndex: 4,
      }}>
        <PhaseRow phase={phase} durations={phaseDur} showNudge={showNudge} />
      </div>

      {/* ═══════ Global tempo slider — right edge ═══════ */}
      {showTuner && (
        <div style={{
          position: 'absolute', right: 14, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center',
          zIndex: 6,
        }}>
          <TempoSlider tempo={tempo} bpm={bpm} onTempoChange={onTempoChange} />
        </div>
      )}

      {/* ═══════ Bottom stats ═══════ */}
      <div style={{
        position: 'absolute', bottom: 58, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 40,
        zIndex: 5,
      }}>
        <Stat label="Elapsed" value="03:12" />
        <Stat label="Rate" value={`${bpm}/min`} />
        <Stat label="Tempo" value={tempo === 1 ? '1.00×' : `${tempo.toFixed(2)}×`} highlight={tempo !== 1} />
      </div>

      {/* ═══════ Tuning update ping — shown only when tempo ≠ 1 ═══════ */}
      {tempo !== 1 && (
        <div style={{
          position: 'absolute', bottom: 118, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          <div style={{
            padding: '6px 12px',
            background: 'oklch(0.26 0.04 230 / 0.5)',
            border: '0.5px solid oklch(0.45 0.06 230)',
            borderRadius: 100,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.12em',
            color: 'oklch(0.88 0.05 230)',
            textTransform: 'uppercase',
          }}>
            Updates next cycle
          </div>
        </div>
      )}
    </IOSDevice>
  );
}

// ─────────────────────────────────────────────────────────────
// Breath shape — three variants
// ─────────────────────────────────────────────────────────────
function BreathShape({ shape, scale, phase, countdown }) {
  if (shape === 'wave') return <WaveShape scale={scale} countdown={countdown} />;
  if (shape === 'ring') return <RingShape scale={scale} countdown={countdown} phase={phase} />;
  return <OrbShape scale={scale} countdown={countdown} />;
}

function OrbShape({ scale, countdown }) {
  const size = 220 * scale;
  return (
    <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer halo rings — static guide */}
      <div style={{
        position: 'absolute', width: 240, height: 240, borderRadius: '50%',
        border: '0.5px dashed oklch(0.4 0.02 230 / 0.4)',
      }} />
      <div style={{
        position: 'absolute', width: 140, height: 140, borderRadius: '50%',
        border: '0.5px dashed oklch(0.4 0.02 230 / 0.25)',
      }} />
      {/* Orb */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, oklch(0.85 0.08 230 / 0.9), oklch(0.55 0.1 230 / 0.5) 60%, oklch(0.35 0.08 230 / 0.15) 100%)',
        boxShadow: '0 0 80px oklch(0.6 0.1 230 / 0.45), inset 0 0 40px oklch(0.9 0.05 230 / 0.2)',
        transition: 'width .4s ease, height .4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {countdown > 0 && (
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 72, fontWeight: 200,
            color: 'oklch(0.98 0.005 80)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.04em',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>{countdown}</div>
        )}
      </div>
    </div>
  );
}

function RingShape({ scale, countdown, phase }) {
  const size = 220;
  // Ring stroke progress: shows where in the full cycle you are
  const r = 100;
  const C = 2 * Math.PI * r;
  // progress through full cycle (fake snapshot)
  const progress = { inhale: 0.15, holdIn: 0.35, exhale: 0.7, holdOut: 0.95 }[phase] || 0.15;
  const scaledSize = size * scale;

  return (
    <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={240} height={240} style={{ position: 'absolute' }}>
        <circle cx={120} cy={120} r={r} fill="none"
          stroke="oklch(0.3 0.02 230 / 0.3)" strokeWidth="1" />
        <circle cx={120} cy={120} r={r} fill="none"
          stroke="oklch(0.78 0.09 230)" strokeWidth="2"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          strokeLinecap="round"
          transform="rotate(-90 120 120)" />
      </svg>
      <div style={{
        width: scaledSize * 0.75, height: scaledSize * 0.75, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, oklch(0.3 0.04 230 / 0.7), oklch(0.2 0.02 230 / 0.3))',
        border: '0.5px solid oklch(0.5 0.06 230 / 0.5)',
        transition: 'all .4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {countdown > 0 && (
          <div style={{
            fontSize: 64, fontWeight: 200,
            color: 'oklch(0.96 0.005 80)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.04em',
          }}>{countdown}</div>
        )}
      </div>
    </div>
  );
}

function WaveShape({ scale, countdown }) {
  // Sine-wave cross-section — amplitude grows with scale
  const amp = 44 * scale;
  const w = 280, h = 140;
  // Build a smooth sine path
  let d = `M 0 ${h/2}`;
  for (let x = 0; x <= w; x += 4) {
    const y = h/2 - Math.sin((x / w) * Math.PI * 2.5) * amp;
    d += ` L ${x} ${y}`;
  }
  return (
    <div style={{ position: 'relative', width: 300, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="wg" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.78 0.09 230 / 0)" />
            <stop offset="0.3" stopColor="oklch(0.78 0.09 230)" />
            <stop offset="0.7" stopColor="oklch(0.78 0.09 230)" />
            <stop offset="1" stopColor="oklch(0.78 0.09 230 / 0)" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Guide center line */}
        <line x1="0" x2={w} y1={h/2} y2={h/2} stroke="oklch(0.4 0.02 230 / 0.3)" strokeDasharray="2 4" />
      </svg>
      {countdown > 0 && (
        <div style={{
          fontSize: 56, fontWeight: 200,
          color: 'oklch(0.96 0.005 80)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.04em',
        }}>{countdown}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Per-phase tappable row — the 4-7-8-0 pattern as live chips
// ─────────────────────────────────────────────────────────────
function PhaseRow({ phase, durations, showNudge }) {
  const phases = [
    { k: 'inhale', label: 'In', d: durations.inhale },
    { k: 'holdIn', label: 'Hold', d: durations.holdIn },
    { k: 'exhale', label: 'Out', d: durations.exhale },
    { k: 'holdOut', label: 'Rest', d: durations.holdOut },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {phases.map((p, i) => {
        const active = p.k === phase;
        return (
          <React.Fragment key={p.k}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 56,
            }}>
              {showNudge && active && (
                <button style={{
                  width: 28, height: 20,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: 'oklch(0.75 0.01 80)',
                  fontSize: 12, cursor: 'pointer', padding: 0,
                  marginBottom: 4,
                }}>＋</button>
              )}
              <div style={{
                padding: '10px 14px',
                background: active ? 'oklch(0.3 0.05 230 / 0.5)' : 'transparent',
                border: `0.5px solid ${active ? 'oklch(0.6 0.08 230)' : 'oklch(0.35 0.01 80 / 0.6)'}`,
                borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                minWidth: 56,
              }}>
                <div style={{
                  fontFamily: 'Inter',
                  fontSize: 20, fontWeight: 400,
                  color: active ? 'oklch(0.95 0.03 230)' : 'oklch(0.65 0.01 80)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{p.d}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: active ? 'oklch(0.75 0.04 230)' : 'oklch(0.5 0.01 80)',
                }}>{p.label}</div>
              </div>
              {showNudge && active && (
                <button style={{
                  width: 28, height: 20,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: 'oklch(0.75 0.01 80)',
                  fontSize: 12, cursor: 'pointer', padding: 0,
                  marginTop: 4,
                }}>－</button>
              )}
            </div>
            {i < phases.length - 1 && (
              <div style={{
                width: 6, height: 1, background: 'oklch(0.4 0.01 80 / 0.5)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tempo buttons — two large tap targets on the right edge
// ─────────────────────────────────────────────────────────────
function TempoSlider({ tempo, bpm, onTempoChange }) {
  const atMax = tempo >= 1.4;
  const atMin = tempo <= 0.6;
  const isOff = tempo === 1.0;

  const btn = (label, handler, disabled) => (
    <button
      onClick={handler}
      disabled={disabled}
      style={{
        width: 48, height: 72, borderRadius: 14,
        background: disabled ? 'oklch(0.22 0.005 80)' : 'oklch(0.26 0.015 230 / 0.7)',
        border: `1px solid ${disabled ? 'oklch(0.28 0.005 80)' : 'oklch(0.45 0.07 230 / 0.6)'}`,
        boxShadow: disabled ? 'none' : '0 0 16px oklch(0.55 0.09 230 / 0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s, box-shadow 0.15s',
        padding: 0,
        color: disabled ? 'oklch(0.4 0.005 80)' : 'oklch(0.88 0.06 230)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label === 'faster' ? (
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path d="M9 1L17 11H1L9 1Z" fill="currentColor" opacity={disabled ? 0.3 : 1} />
        </svg>
      ) : (
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path d="M9 11L1 1H17L9 11Z" fill="currentColor" opacity={disabled ? 0.3 : 1} />
        </svg>
      )}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8, letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: disabled ? 'oklch(0.38 0.005 80)' : 'oklch(0.72 0.05 230)',
      }}>{label === 'faster' ? 'Fast' : 'Slow'}</div>
    </button>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      {btn('faster', () => onTempoChange(Math.min(1.4, parseFloat((tempo + 0.05).toFixed(2)))), atMax)}

      {/* Live multiplier readout */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '8px 0',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          color: isOff ? 'oklch(0.5 0.01 80)' : 'oklch(0.88 0.07 230)',
        }}>{tempo.toFixed(2)}×</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'oklch(0.45 0.01 80)',
        }}>tempo</div>
      </div>

      {btn('slower', () => onTempoChange(Math.max(0.6, parseFloat((tempo - 0.05).toFixed(2)))), atMin)}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9, letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'oklch(0.5 0.01 80)',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Inter', fontSize: 14, fontWeight: 400,
        color: highlight ? 'oklch(0.85 0.08 230)' : 'oklch(0.88 0.008 80)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App shell
// ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "shape": "orb",
  "phase": "inhale",
  "tempo": 1.0,
  "showTuner": true,
  "showNudge": false
}/*EDITMODE-END*/;

function App() {
  const [shape, setShape] = React.useState(TWEAK_DEFAULTS.shape);
  const [phase, setPhase] = React.useState(TWEAK_DEFAULTS.phase);
  const [tempo, setTempo] = React.useState(TWEAK_DEFAULTS.tempo);
  const [showTuner, setShowTuner] = React.useState(TWEAK_DEFAULTS.showTuner);
  const [showNudge, setShowNudge] = React.useState(TWEAK_DEFAULTS.showNudge);

  // Tweaks host integration
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') {
        document.getElementById('tweaks')?.classList.add('on');
      } else if (e.data.type === '__deactivate_edit_mode') {
        document.getElementById('tweaks')?.classList.remove('on');
      }
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');

    // Wire segmented controls
    const wireSeg = (id, setter, currentGetter) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          const v = b.dataset.v;
          el.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          setter(v);
        });
      });
    };
    wireSeg('shapeSeg', (v) => { setShape(v); persist({ shape: v }); document.getElementById('shapeVal').textContent = v; });
    wireSeg('phaseSeg', (v) => { setPhase(v); persist({ phase: v }); document.getElementById('phaseVal').textContent = v; });
    wireSeg('tunerSeg', (v) => { setShowTuner(v === 'on'); persist({ showTuner: v === 'on' }); document.getElementById('tunerVal').textContent = v; });
    wireSeg('nudgeSeg', (v) => { setShowNudge(v === 'shown'); persist({ showNudge: v === 'shown' }); document.getElementById('nudgeVal').textContent = v; });

    const tr = document.getElementById('tempoRange');
    tr?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      setTempo(v);
      persist({ tempo: v });
      document.getElementById('tempoVal').textContent = `${v.toFixed(2)}×`;
    });

    return () => window.removeEventListener('message', onMsg);
  }, []);

  const persist = (edits) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  };

  return (
    <div className="page">
      <div className="header">
        <div className="eyebrow">Breathing App · Mockup 01 · Session Screen</div>
        <h1>Session screen — with live tuning</h1>
        <p className="lede">
          Phone-down-first: big hit targets, high-contrast shape against deep charcoal,
          minimal chrome. The tempo slider sits on the right edge so a thumb can find it
          without looking. Tap a phase chip to nudge a single phase by ±1s. Changes
          apply on the next cycle, confirmed by the "updates next cycle" ping.
        </p>
        <p className="lede" style={{ color: 'oklch(0.6 0.01 80)', fontSize: 13 }}>
          Toggle <b>Tweaks</b> in the toolbar to flip through phases, shape styles, and tuning states.
        </p>
      </div>

      <div className="canvas">
        <div className="device-col">
          <SessionScreen
            shape={shape}
            phase={phase}
            tempo={tempo}
            showTuner={showTuner}
            showNudge={showNudge}
            onTempoChange={(v) => { setTempo(v); persist({ tempo: v }); document.getElementById('tempoVal').textContent = `${v.toFixed(2)}×`; document.getElementById('tempoRange').value = v; }}
          />
          <div className="device-label">Session · {phase} · {shape} · {tempo.toFixed(2)}×</div>
        </div>

        <div className="notes">
          <div className="note">
            <div className="note-title">Shape</div>
            <div className="note-body">
              Expands on inhale, contracts on exhale. Holds freeze the shape; the
              countdown number inside keeps the user anchored. Three styles to try:
              orb (default), ring (shows cycle progress), wave (flat, for motion-sensitive users).
            </div>
          </div>
          <div className="note">
            <div className="note-title">Global tempo</div>
            <div className="note-body">
              Vertical rail on the right edge. Preserves the 4-7-8-0 ratio —
              pulling the knob down to 0.80× stretches every phase proportionally.
              Knob shows the live multiplier so users can learn their "preferred" tempo.
            </div>
          </div>
          <div className="note">
            <div className="note-title">Per-phase nudge</div>
            <div className="note-body">
              Hidden by default to keep the screen calm. Long-press a phase chip
              (or toggle in Tweaks) to reveal ±1s buttons on the active phase only.
              Matches the brainstorm's "start global, add per-phase if users ask."
            </div>
          </div>
          <div className="note">
            <div className="note-title">Feedback on change</div>
            <div className="note-body">
              Pill pings "Updates next cycle" whenever the user touches a control.
              Haptic tap accompanies it for phone-down use. No mid-breath jumps.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
