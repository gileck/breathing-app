# Audio samples

The breathing session player supports recorded cue styles in addition to
synthesized ones. To enable them, drop the following files into this
folder:

| File        | Style ID | Recommended length | Target size |
| ----------- | -------- | ------------------ | ----------- |
| `gong.ogg`  | `gong`   | 2–4 s              | < 40 KB     |
| `bowl.ogg`  | `bowl`   | 3–6 s              | < 60 KB     |

## Where to find CC0 sources

- **Freesound.org** — filter by "Creative Commons 0" license.
  - Search: `gong strike`, `singing bowl strike`, `meditation bowl`, `tibetan bowl`.
- **Pixabay Audio** — all uploads are CC0-like (`https://pixabay.com/sound-effects/`).
- **BBC Sound Effects** — personal and educational use only.
- **Sonniss GDC Game Audio Bundle** — yearly free bundle; check per-bundle licence.

## Encoding

Convert to `.ogg` (Vorbis) for broad browser support and good size/quality.

```sh
# Using ffmpeg — target ~96 kbps mono is plenty for a cue sound.
ffmpeg -i input.wav -c:a libvorbis -q:a 3 -ac 1 -ar 44100 gong.ogg
ffmpeg -i input.wav -c:a libvorbis -q:a 3 -ac 1 -ar 44100 bowl.ogg
```

Trim leading silence and fade the tail so the sample starts on its
attack and decays cleanly — the player pitches each phase by adjusting
`playbackRate`, so a clean single-strike sample works best.

## Attribution

Record the source of each file in `LICENSE.md` next to this README so
future contributors can verify licensing.

## Fallback behavior

If a file is missing, the session player logs nothing and the style
falls back to the synthesized `tones` cue. The `/audio` settings screen
shows a `missing` badge next to styles whose sample couldn't be loaded.
