import type { ControlSchema } from "../../controls";

export const schema = {
  animation: {
    type: "segmented",
    label: "Animation",
    options: ["None", "Tween", "Spring", "Roll", "Fade", "Pulse"],
    default: "Tween",
    section: "Number",
  },
} as const satisfies ControlSchema;

export type AnimationVariant = (typeof schema)["animation"]["options"][number];
