# TINY UI · 001 — Range Slider

A range slider where the two values can become one.

The smallest interaction in a filter UI is the moment two thumbs collide. Most sliders just stop. This one merges, translates, and splits — three states, one continuous motion.

→ [sabatostudio/range-slider](https://github.com/sabatostudio/range-slider)

## What's inside

**Metaball Merge** — when the two values get close, the pills fuse into one through an SVG goo filter.

**Collapse on Cross** — drag a thumb past the other and the range snaps shut at the merge point.

**Translate as One** — while merged mid-drag, the single value follows the cursor as one unit.

**Cross-axis Split** — pull the merged pill perpendicular to the track to break the range back open. Trailing thumb stays at the merge point, leading thumb continues with the cursor.

**Choreographed Autoplay** — a self-running demo that walks through the full state machine, ending exactly where it started so the loop has no seam.

**4K Record-to-File** — built-in recorder captures a 1080² loop at 60 fps, 40 Mbps H.264, ready to upload to LinkedIn / X / Instagram without further re-encoding.

## Stack

- **React 19** + **TypeScript**
- **Motion** (`motion/react`) for animations and choreography
- **Radix Slider** primitive, customized
- **Tailwind CSS v4**
- **Vite**

## Run locally

```bash
pnpm install
pnpm dev
```

Then visit:

- `/` — gallery of all prototypes
- `/p/price-range-v2` — lab view (with breadcrumb)
- `/solo/price-range-v2` — solo showcase view (no chrome, recordable)

## Record a loop

1. Open `/solo/price-range-v2`
2. Click the record button (bottom-right, the red dot)
3. Choose "This tab" in the share-screen prompt
4. The choreography plays twice; the file downloads when it's done
5. Drop the resulting `.mp4` straight into LinkedIn / X / IG

## Why a range slider

Filter UIs ship every day with a slider that has two thumbs and one rule: don't let them touch. So I asked: what happens if they do?

The answer turned into 50 hours of micro-decisions about merge thresholds, gesture intent, spring damping, and metaball blur radii. None of those decisions are visible. They just make the thing feel right.

## Series

This is the first in a series of small interaction studies. Each one takes a UI element nobody thinks about and treats it like the only thing that matters.

→ Next: TINY UI · 002

## Built with

Figma + Claude Code. The tools changed. The taste didn't.

—

Made by [Sabato](https://www.linkedin.com/in/sabatostudio).
