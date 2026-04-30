export interface SliderControl {
  type: "slider";
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
  section?: string;
}

export interface SegmentedControl {
  type: "segmented";
  label: string;
  options: string[];
  default: string;
  section?: string;
}

export interface ToggleControl {
  type: "toggle";
  label: string;
  default: boolean;
  section?: string;
}

export interface PillsControl {
  type: "pills";
  label: string;
  options: readonly number[];
  default: number;
  unit?: string;
  section?: string;
}

export type Control =
  | SliderControl
  | SegmentedControl
  | ToggleControl
  | PillsControl;

export type ControlSchema = Record<string, Control>;

export type ControlValues<T extends ControlSchema> = {
  [K in keyof T]: T[K] extends SliderControl
    ? number
    : T[K] extends SegmentedControl
      ? string
      : T[K] extends ToggleControl
        ? boolean
        : T[K] extends PillsControl
          ? number
          : never;
};
