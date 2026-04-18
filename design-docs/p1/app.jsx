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
// ─────────────────────────────────────────────────────────────
// Pattern Builder Screen
// ─────────────────────────────────────────────────────────────
const PRESETS = [
  { name: 'Box 4-4-4-4',     inhale:4, holdIn:4, exhale:4, holdOut:4 },
  { name: '4-7-8',           inhale:4, holdIn:7, exhale:8, holdOut:0 },
  { name: 'Coherent 5-5',    inhale:5, holdIn:0, exhale:5, holdOut:0 },
  { name: 'Morning Rise',    inhale:4, holdIn:2, exhale:6, holdOut:2 },
  { name: 'Anxiety Reset',   inhale:4, holdIn:7, exhale:8, holdOut:0 },
  { name: 'Pre-Sleep',       inhale:4, holdIn:4, exhale:6, holdOut:2 },
];

function PatternBuilderScreen({ showSaveModal = false }) {
  const [pattern, setPattern] = React.useState({ inhale:4, holdIn:7, exhale:8, holdOut:0 });
  const [saveOpen, setSaveOpen] = React.useState(showSaveModal);
  const [name, setName] = React.useState('');

  const total = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;
  const bpm = total > 0 ? (60 / total).toFixed(1) : '—';

  const phases = [
    { k:'inhale',  label:'Inhale',   color:'oklch(0.78 0.09 230)' },
    { k:'holdIn',  label:'Hold in',  color:'oklch(0.78 0.07 180)' },
    { k:'exhale',  label:'Exhale',   color:'oklch(0.75 0.09 260)' },
    { k:'holdOut', label:'Hold out', color:'oklch(0.65 0.05 280)' },
  ];

  const nudge = (k, delta) => {
    setPattern(p => ({ ...p, [k]: Math.max(0, Math.min(30, p[k] + delta)) }));
  };

  // Mini timeline bar
  const TimelineBar = () => {
    const barPhases = phases.filter(p => pattern[p.k] > 0);
    return (
      <div style={{ display:'flex', gap:2, height:4, borderRadius:2, overflow:'hidden', margin:'0 20px 2px' }}>
        {phases.map(p => pattern[p.k] > 0 && (
          <div key={p.k} style={{
            flex: pattern[p.k],
            background: p.color,
            borderRadius: 2,
            opacity: 0.8,
          }} />
        ))}
      </div>
    );
  };

  return (
    <IOSDevice width={402} height={874} dark={true}>
      <div style={{ position:'absolute', inset:0, background:'oklch(0.15 0.008 60)', zIndex:0 }} />

      {/* Nav */}
      <div style={{
        position:'absolute', top:62, left:0, right:0,
        padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        zIndex:5,
      }}>
        <div style={{ fontFamily:'Inter', fontSize:22, fontWeight:300, color:'oklch(0.96 0.005 80)', letterSpacing:'-0.01em' }}>
          Pattern Builder
        </div>
        <button style={{
          padding:'8px 14px', borderRadius:20,
          background:'oklch(0.78 0.09 230 / 0.15)',
          border:'1px solid oklch(0.78 0.09 230 / 0.4)',
          color:'oklch(0.82 0.07 230)', fontFamily:'Inter', fontSize:13, fontWeight:500,
          cursor:'pointer',
        }}>▶ Start</button>
      </div>

      {/* BPM readout */}
      <div style={{
        position:'absolute', top:120, left:0, right:0,
        display:'flex', flexDirection:'column', alignItems:'center', gap:4,
        zIndex:5,
      }}>
        <div style={{
          fontFamily:'Inter', fontSize:56, fontWeight:200, letterSpacing:'-0.04em',
          color:'oklch(0.96 0.005 80)', fontVariantNumeric:'tabular-nums', lineHeight:1,
        }}>{bpm}</div>
        <div style={{
          fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.18em',
          textTransform:'uppercase', color:'oklch(0.55 0.01 80)',
        }}>breaths / min</div>
        <div style={{ marginTop:6, width:320 }}><TimelineBar /></div>
        <div style={{
          fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'oklch(0.5 0.01 80)',
          letterSpacing:'0.08em',
        }}>
          {pattern.inhale}–{pattern.holdIn}–{pattern.exhale}–{pattern.holdOut}
        </div>
      </div>

      {/* Phase rows */}
      <div style={{
        position:'absolute', top:264, left:0, right:0,
        padding:'0 20px', display:'flex', flexDirection:'column', gap:10,
        zIndex:5,
      }}>
        {phases.map(p => (
          <div key={p.k} style={{
            display:'flex', alignItems:'center',
            background:'oklch(0.20 0.008 60)',
            borderRadius:16,
            padding:'14px 18px',
            border:'0.5px solid oklch(0.28 0.01 80)',
          }}>
            {/* Color swatch */}
            <div style={{ width:4, height:36, borderRadius:2, background:p.color, marginRight:14, flexShrink:0 }} />
            {/* Label */}
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:400, color:'oklch(0.88 0.008 80)' }}>{p.label}</div>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'oklch(0.5 0.01 80)', marginTop:2 }}>
                {pattern[p.k] > 0 ? `${pattern[p.k]}s` : 'skip'}
              </div>
            </div>
            {/* Stepper */}
            <div style={{ display:'flex', alignItems:'center', gap:0 }}>
              <button onClick={() => nudge(p.k, -1)} style={{
                width:44, height:44, borderRadius:'12px 0 0 12px',
                background:'oklch(0.25 0.008 80)',
                border:'0.5px solid oklch(0.32 0.01 80)',
                color:'oklch(0.85 0.01 80)', fontSize:20, fontWeight:300,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}>−</button>
              <div style={{
                width:48, height:44, background:'oklch(0.22 0.008 80)',
                border:'0.5px solid oklch(0.32 0.01 80)',
                borderLeft:'none', borderRight:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:500,
                color:'oklch(0.96 0.005 80)', fontVariantNumeric:'tabular-nums',
              }}>{pattern[p.k]}</div>
              <button onClick={() => nudge(p.k, 1)} style={{
                width:44, height:44, borderRadius:'0 12px 12px 0',
                background:'oklch(0.25 0.008 80)',
                border:'0.5px solid oklch(0.32 0.01 80)',
                color:'oklch(0.85 0.01 80)', fontSize:20, fontWeight:300,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{
        position:'absolute', bottom:50, left:0, right:0,
        padding:'0 20px', display:'flex', gap:10,
        zIndex:5,
      }}>
        <button onClick={() => setSaveOpen(true)} style={{
          flex:1, height:52, borderRadius:14,
          background:'oklch(0.22 0.008 80)',
          border:'0.5px solid oklch(0.35 0.01 80)',
          color:'oklch(0.85 0.008 80)', fontFamily:'Inter', fontSize:15, fontWeight:500,
          cursor:'pointer',
        }}>Save</button>
        <button style={{
          flex:2, height:52, borderRadius:14,
          background:'oklch(0.78 0.09 230)',
          border:'none',
          color:'oklch(0.12 0.01 80)', fontFamily:'Inter', fontSize:15, fontWeight:600,
          cursor:'pointer',
        }}>▶  Start Session</button>
      </div>

      {/* Save modal */}
      {saveOpen && (
        <div style={{
          position:'absolute', inset:0, zIndex:20,
          background:'oklch(0.10 0.005 80 / 0.7)',
          backdropFilter:'blur(12px)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end',
        }}>
          <div style={{
            background:'oklch(0.22 0.01 80)',
            borderRadius:'24px 24px 0 0',
            padding:'28px 24px 48px',
            display:'flex', flexDirection:'column', gap:20,
            border:'0.5px solid oklch(0.30 0.01 80)',
          }}>
            {/* Handle */}
            <div style={{ width:36, height:4, borderRadius:2, background:'oklch(0.40 0.01 80)', alignSelf:'center', marginTop:-12, marginBottom:4 }} />

            <div style={{ fontFamily:'Inter', fontSize:20, fontWeight:400, color:'oklch(0.96 0.005 80)' }}>
              Save exercise
            </div>

            <div style={{
              fontFamily:'JetBrains Mono, monospace', fontSize:11,
              color:'oklch(0.55 0.01 80)', letterSpacing:'0.06em',
            }}>
              {pattern.inhale}–{pattern.holdIn}–{pattern.exhale}–{pattern.holdOut} · {bpm} bpm
            </div>

            {/* Name input mock */}
            <div style={{
              background:'oklch(0.18 0.008 80)',
              border:'1px solid oklch(0.78 0.09 230 / 0.6)',
              borderRadius:12, padding:'14px 16px',
              fontFamily:'Inter', fontSize:16,
              color:'oklch(0.96 0.005 80)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ opacity: name ? 1 : 0.35 }}>{name || 'Exercise name…'}</span>
              <div style={{ width:2, height:20, background:'oklch(0.78 0.09 230)', borderRadius:1, animation:'none' }} />
            </div>

            {/* Preset name suggestions */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['Morning', 'Pre-sleep', 'Focus', 'Anxiety reset'].map(s => (
                <button key={s} onClick={() => setName(s)} style={{
                  padding:'6px 12px', borderRadius:20,
                  background: name === s ? 'oklch(0.78 0.09 230 / 0.2)' : 'oklch(0.26 0.008 80)',
                  border: `0.5px solid ${name === s ? 'oklch(0.78 0.09 230)' : 'oklch(0.32 0.01 80)'}`,
                  color: name === s ? 'oklch(0.85 0.07 230)' : 'oklch(0.72 0.01 80)',
                  fontFamily:'Inter', fontSize:12, cursor:'pointer',
                }}>{s}</button>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setSaveOpen(false)} style={{
                flex:1, height:48, borderRadius:12,
                background:'oklch(0.26 0.008 80)',
                border:'0.5px solid oklch(0.32 0.01 80)',
                color:'oklch(0.72 0.01 80)', fontFamily:'Inter', fontSize:15,
                cursor:'pointer',
              }}>Cancel</button>
              <button style={{
                flex:2, height:48, borderRadius:12,
                background:'oklch(0.78 0.09 230)',
                border:'none',
                color:'oklch(0.12 0.01 80)', fontFamily:'Inter', fontSize:15, fontWeight:600,
                cursor:'pointer',
              }}>Save exercise</button>
            </div>
          </div>
        </div>
      )}
    </IOSDevice>
  );
}

// ─────────────────────────────────────────────────────────────
// Saved Exercises List Screen
// ─────────────────────────────────────────────────────────────
function SavedListScreen() {
  const [selected, setSelected] = React.useState(1);

  const exercises = [
    { name:'Morning Rise',   inhale:4, holdIn:2, exhale:6, holdOut:2, lastUsed:'Today' },
    { name:'4-7-8',          inhale:4, holdIn:7, exhale:8, holdOut:0, lastUsed:'Yesterday' },
    { name:'Box Breathing',  inhale:4, holdIn:4, exhale:4, holdOut:4, lastUsed:'3 days ago' },
    { name:'Coherent 5-5',   inhale:5, holdIn:0, exhale:5, holdOut:0, lastUsed:'Last week' },
    { name:'Anxiety Reset',  inhale:4, holdIn:7, exhale:8, holdOut:0, lastUsed:'Last week' },
    { name:'Pre-Sleep',      inhale:4, holdIn:4, exhale:6, holdOut:2, lastUsed:'2 weeks ago' },
  ];

  const bpm = (e) => {
    const t = e.inhale + e.holdIn + e.exhale + e.holdOut;
    return t > 0 ? (60 / t).toFixed(1) : '—';
  };

  const patStr = (e) => `${e.inhale}–${e.holdIn}–${e.exhale}–${e.holdOut}`;

  // Mini 4-segment bar for each row
  const MiniBar = ({ e }) => {
    const total = e.inhale + e.holdIn + e.exhale + e.holdOut;
    const colors = ['oklch(0.78 0.09 230)','oklch(0.78 0.07 180)','oklch(0.75 0.09 260)','oklch(0.65 0.05 280)'];
    const vals = [e.inhale, e.holdIn, e.exhale, e.holdOut];
    return (
      <div style={{ display:'flex', gap:1, height:3, width:64, borderRadius:2, overflow:'hidden' }}>
        {vals.map((v,i) => v > 0 && (
          <div key={i} style={{ flex:v, background:colors[i], opacity:0.75 }} />
        ))}
      </div>
    );
  };

  return (
    <IOSDevice width={402} height={874} dark={true}>
      <div style={{ position:'absolute', inset:0, background:'oklch(0.15 0.008 60)', zIndex:0 }} />

      {/* Nav */}
      <div style={{
        position:'absolute', top:62, left:0, right:0,
        padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        zIndex:5,
      }}>
        <div style={{ fontFamily:'Inter', fontSize:22, fontWeight:300, color:'oklch(0.96 0.005 80)', letterSpacing:'-0.01em' }}>
          My Exercises
        </div>
        <button style={{
          width:36, height:36, borderRadius:18,
          background:'oklch(0.78 0.09 230 / 0.15)',
          border:'1px solid oklch(0.78 0.09 230 / 0.4)',
          color:'oklch(0.82 0.07 230)', fontSize:20, fontWeight:300,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        }}>+</button>
      </div>

      {/* Pinned / last-used card */}
      <div style={{
        position:'absolute', top:118, left:20, right:20,
        background:'oklch(0.26 0.04 230 / 0.35)',
        border:'0.5px solid oklch(0.45 0.07 230 / 0.5)',
        borderRadius:20, padding:'18px 20px',
        zIndex:5,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'oklch(0.65 0.07 230)', marginBottom:6 }}>Pinned</div>
            <div style={{ fontFamily:'Inter', fontSize:18, fontWeight:400, color:'oklch(0.96 0.005 80)' }}>Morning Rise</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'oklch(0.55 0.01 80)', marginTop:4 }}>4–2–6–2 · 5.0 bpm</div>
          </div>
          <button style={{
            padding:'10px 18px', borderRadius:20,
            background:'oklch(0.78 0.09 230)',
            border:'none',
            color:'oklch(0.12 0.01 80)', fontFamily:'Inter', fontSize:13, fontWeight:600,
            cursor:'pointer',
          }}>▶ Start</button>
        </div>
      </div>

      {/* List */}
      <div style={{
        position:'absolute', top:268, left:0, right:0, bottom:40,
        overflowY:'auto', padding:'0 20px',
        display:'flex', flexDirection:'column', gap:8,
        zIndex:5,
      }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'oklch(0.45 0.01 80)', marginBottom:4 }}>All exercises</div>
        {exercises.map((e, i) => {
          const active = i === selected;
          return (
            <div key={e.name}
              onClick={() => setSelected(i)}
              style={{
                display:'flex', alignItems:'center',
                background: active ? 'oklch(0.22 0.01 230 / 0.5)' : 'oklch(0.20 0.008 60)',
                border: `0.5px solid ${active ? 'oklch(0.45 0.07 230 / 0.6)' : 'oklch(0.28 0.01 80)'}`,
                borderRadius:14, padding:'14px 16px',
                cursor:'pointer', gap:14,
              }}>
              {/* Color dot */}
              <div style={{
                width:8, height:8, borderRadius:'50%',
                background: active ? 'oklch(0.78 0.09 230)' : 'oklch(0.40 0.02 80)',
                flexShrink:0,
              }} />
              {/* Text */}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Inter', fontSize:15, fontWeight: active ? 500 : 400, color: active ? 'oklch(0.96 0.005 80)' : 'oklch(0.82 0.008 80)' }}>{e.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                  <MiniBar e={e} />
                  <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'oklch(0.50 0.01 80)' }}>
                    {patStr(e)} · {bpm(e)}/min
                  </div>
                </div>
              </div>
              {/* Last used */}
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'oklch(0.42 0.01 80)', textAlign:'right', flexShrink:0 }}>{e.lastUsed}</div>
              {/* Chevron */}
              <svg width="7" height="12" viewBox="0 0 7 12">
                <path d="M1 1l5 5-5 5" stroke={active ? 'oklch(0.65 0.06 230)' : 'oklch(0.40 0.01 80)'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          );
        })}
      </div>
    </IOSDevice>
  );
}

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
        <div className="eyebrow">Breathing App · Mockup 01</div>
        <h1>Three screens</h1>
        <p className="lede">
          Session (live tuning), pattern builder (steppers + BPM preview), and saved exercises library.
          Toggle <b>Tweaks</b> in the toolbar to explore shape, phase, and tuning states on the session screen.
        </p>
      </div>

      <div className="canvas" style={{ alignItems: 'flex-start', gap: 32 }}>

        {/* ── Screen 1: Saved list ── */}
        <div className="device-col">
          <SavedListScreen />
          <div className="device-label">My Exercises — list</div>
        </div>

        {/* ── Screen 2: Pattern builder ── */}
        <div className="device-col">
          <PatternBuilderScreen />
          <div className="device-label">Pattern Builder — steppers</div>
        </div>

        {/* ── Screen 2b: Pattern builder with save modal ── */}
        <div className="device-col">
          <PatternBuilderScreen showSaveModal={true} />
          <div className="device-label">Pattern Builder — save sheet</div>
        </div>

        {/* ── Screen 3: Session ── */}
        <div className="device-col">
          <SessionScreen
            shape={shape}
            phase={phase}
            tempo={tempo}
            showTuner={showTuner}
            showNudge={showNudge}
            onTempoChange={(v) => { setTempo(v); persist({ tempo: v }); document.getElementById('tempoVal').textContent = `${v.toFixed(2)}×`; document.getElementById('tempoRange').value = v; }}
          />
          <div className="device-label">Session · live tuning · {phase}</div>
        </div>

      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
