// 6 motion presets spanning the meaningful axes of spring/tween behavior.
// Grounded in Emil Kowalski's animations.dev lessons:
// - ease-out for enter, ease-in-out-expo for cinematic morph
// - springs for interruptible drag, tween for fixed-duration morph
// - bounce only where playful (Bouncy); critically damped elsewhere
// - Instant respects the "100×/day → don't animate" rule

export type PresetId =
  | "snappy"
  | "smooth"
  | "bouncy"
  | "heavy"
  | "cinematic"
  | "instant";

export interface PresetValues {
  stiffness: number;
  damping: number;
  mass: number;
  exitDuration: number;
  dragRotation: number;
}

export interface Preset {
  id: PresetId;
  label: string;
  // Tween presets ignore stiffness/damping/mass for the morph; those values
  // are still written so sliders display something sensible.
  tween?: { duration: number; ease: [number, number, number, number] };
  values: PresetValues;
}

// ease-in-out-expo (Emil's recommendation for on-screen morph)
const EASE_IN_OUT_EXPO: [number, number, number, number] = [1, 0, 0, 1];

export const PRESETS: Record<PresetId, Preset> = {
  snappy: {
    id: "snappy",
    label: "Snappy",
    values: {
      stiffness: 400,
      damping: 20,
      mass: 0.5,
      exitDuration: 0.1,
      dragRotation: 8,
    },
  },
  smooth: {
    id: "smooth",
    label: "Smooth",
    values: {
      stiffness: 260,
      damping: 20,
      mass: 1,
      exitDuration: 0.15,
      dragRotation: 8,
    },
  },
  bouncy: {
    id: "bouncy",
    label: "Bouncy",
    values: {
      stiffness: 260,
      damping: 15,
      mass: 1,
      exitDuration: 0.25,
      dragRotation: 16,
    },
  },
  heavy: {
    id: "heavy",
    label: "Heavy",
    values: {
      stiffness: 150,
      damping: 30,
      mass: 2,
      exitDuration: 0.25,
      dragRotation: 0,
    },
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematic",
    tween: { duration: 0.5, ease: EASE_IN_OUT_EXPO },
    values: {
      stiffness: 150,
      damping: 30,
      mass: 2,
      exitDuration: 0.25,
      dragRotation: 8,
    },
  },
  instant: {
    id: "instant",
    label: "Instant",
    values: {
      stiffness: 400,
      damping: 30,
      mass: 0.5,
      exitDuration: 0.1,
      dragRotation: 0,
    },
  },
};

export const PRESET_ORDER: PresetId[] = [
  "snappy",
  "smooth",
  "bouncy",
  "heavy",
  "cinematic",
  "instant",
];

// Match current values against presets. Used to highlight the active pill
// when no explicit ?preset= param is set (or when it's out of sync).
export function matchPreset(values: PresetValues): PresetId | null {
  for (const id of PRESET_ORDER) {
    const p = PRESETS[id].values;
    if (
      p.stiffness === values.stiffness &&
      p.damping === values.damping &&
      p.mass === values.mass &&
      p.exitDuration === values.exitDuration &&
      p.dragRotation === values.dragRotation
    ) {
      return id;
    }
  }
  return null;
}
