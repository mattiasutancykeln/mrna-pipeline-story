# Pipeline story — scroll-driven molecular explainer

A standalone, offline, scroll-driven web report that follows **one tumour
mutation** through all five pipeline phases — DNA → protein → peptide → MHC →
T-cell recognition → mRNA design → manufacturing — and ends on the real
to-manufacture mRNA construct. Real PDB structures are the hero (rendered as
cartoon ribbons via 3Dmol.js); every tool and benchmark number is data-bound to
the committed pipeline outputs.

Design rationale and as-built notes:
[`docs/superpowers/specs/2026-06-09-pipeline-story-animation-design.md`](../../docs/superpowers/specs/2026-06-09-pipeline-story-animation-design.md).

## View it

Open `pipeline_story.html` in any modern browser — **no server needed**. The page
is fully self-contained for `file://`: PDBs and data are inlined as `window`
globals (`fetch` is blocked under `file://`), and only the web fonts come from a
CDN (the page still renders offline without them).

## Regenerate the data

```bash
uv run python scripts/report/build_story.py
```

This (re)emits three data files from the committed pipeline artifacts — never edit
them by hand:

- `story_data.js` → `window.STORY_DATA` — acts, tools, benchmark metrics
  (asserts every tool + scorecard metric is assigned to a beat; coverage cannot
  silently regress).
- `structures.js` → `window.STRUCTURES` — inlined hero PDBs (1BNA, 1AKE, 4MNQ, …).
- `payload.js` → `window.PAYLOAD` — the real canine-OSA Phase-5 `FinalConstruct`
  for the closing payload section.

## File map

| File | Role |
|---|---|
| `pipeline_story.html` | shell: hero · five act sections · payload · coda; script load order |
| `story.css` | editorial design tokens, full-bleed viewers + smoke vignette, infobox flow, construct/payload styles, reduced-motion fallback |
| `mol.js` | 3Dmol scene engine — scroll-driven camera paths; per-structure orient/style/reveal (`dna` · `protein` · `dock` · `pmhc`) |
| `story_flow.js` | shared infobox-flow builder (`makeInfoCard`, `StoryFlow`) |
| `story.js` | Act 1 engine; owns the page-wide Lenis + ScrollTrigger setup |
| `story_act2.js` | Act 2 engine (protein → pMHC docking) |
| `story_construct.js` | Acts 3–5 engine (ranking → construct → QC) |
| `story_payload.js` | closing real-payload section |
| `story_bridge.js` | through-line mutation token + per-act context/rail updates |
| `vendor/` | GSAP + ScrollTrigger + Lenis + 3Dmol.js (vendored for offline use) |
| `structures/` | source PDBs (inlined into `structures.js` by the build) |

## Notes

- **Structure-first, no clip-art.** Molecular beats render real PDBs; only the
  sequence-design phases (Acts 3–5) use a clean editorial SVG construct track.
- **Honest data.** The HTML/JS read only the generated data files — no hardcoded
  numbers. Every benchmark figure traces to its literature and source CSV.
- **Reduced motion.** `prefers-reduced-motion` falls back to static, fully-revealed
  scenes.
