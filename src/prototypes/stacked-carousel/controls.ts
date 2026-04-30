import type { ControlSchema } from "../../controls";

export const schema = {
  stackDirection: {
    type: "segmented",
    label: "Direction",
    options: ["up", "down", "left", "right"],
    default: "down",
    section: "Layout",
  },
  stackSpacing: {
    type: "segmented",
    label: "Stack Spacing",
    options: ["tight", "regular", "loose"],
    default: "regular",
    section: "Layout",
  },
  depthBlur: {
    type: "segmented",
    label: "Depth Blur",
    options: ["Off", "On"],
    default: "Off",
    section: "Layout",
  },
  tintBackground: {
    type: "segmented",
    label: "Tint BG",
    options: ["Off", "On"],
    default: "Off",
    section: "Layout",
  },
  dragRotation: {
    type: "pills",
    label: "Rotation",
    options: [0, 8, 16, 32],
    default: 8,
    unit: "°",
    section: "Motion",
  },
  stiffness: {
    type: "pills",
    label: "Stiffness",
    options: [150, 260, 400],
    default: 260,
    section: "Spring",
  },
  damping: {
    type: "pills",
    label: "Damping",
    options: [15, 20, 30],
    default: 20,
    section: "Spring",
  },
  mass: {
    type: "pills",
    label: "Mass",
    options: [0.5, 1, 2],
    default: 1,
    section: "Spring",
  },
  exitDuration: {
    type: "pills",
    label: "Exit",
    options: [0.1, 0.15, 0.25],
    default: 0.15,
    unit: "s",
    section: "Spring",
  },
} as const satisfies ControlSchema;
