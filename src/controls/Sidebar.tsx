import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import type { Control, ControlSchema, ControlValues } from "./types";

interface SidebarProps<T extends ControlSchema> {
  schema: T;
  values: ControlValues<T>;
  onChange: (key: keyof T, value: number | string | boolean) => void;
  header?: ReactNode;
  // Insert custom content after a named section. Keys match UPPERCASED section titles.
  afterSection?: Record<string, ReactNode>;
}

interface SectionGroup {
  title: string;
  entries: [string, Control][];
}

export function Sidebar<T extends ControlSchema>({
  schema,
  values,
  onChange,
  header,
  afterSection,
}: SidebarProps<T>) {
  // Group controls into sections, preserving first-seen order.
  const sections = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>();
    for (const [key, control] of Object.entries(schema)) {
      const title = (control.section ?? "Controls").toUpperCase();
      if (!map.has(title)) map.set(title, { title, entries: [] });
      map.get(title)!.entries.push([key, control]);
    }
    return Array.from(map.values());
  }, [schema]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="w-72 shrink-0 font-mono">
      {header}
      {sections.map((section, i) => {
        const isCollapsed = collapsed[section.title];
        const insert = afterSection?.[section.title];
        return (
          <Fragment key={section.title}>
            <section
              className={i > 0 ? "border-t border-surface" : ""}
            >
              <button
                onClick={() =>
                  setCollapsed((s) => ({ ...s, [section.title]: !s[section.title] }))
                }
                className="flex items-center justify-between w-full px-5 pt-5 pb-3 text-[11px] tracking-[0.14em] text-ink/80 hover:text-ink transition-colors"
              >
                <span>{section.title}</span>
                <Chevron collapsed={!!isCollapsed} />
              </button>

              {!isCollapsed && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  {section.entries.map(([key, control]) => (
                    <ControlRow
                      key={key}
                      controlKey={key}
                      control={control}
                      value={values[key as keyof T]}
                      onChange={onChange}
                    />
                  ))}
                </div>
              )}
            </section>
            {insert}
          </Fragment>
        );
      })}
    </aside>
  );
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={`transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
    >
      <path
        d="M2 3.5 L5 6.5 L8 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ControlRow<T extends ControlSchema>({
  controlKey,
  control,
  value,
  onChange,
}: {
  controlKey: string;
  control: Control;
  value: ControlValues<T>[keyof T];
  onChange: SidebarProps<T>["onChange"];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] tracking-[0.14em] text-muted/70">
        {control.label.toUpperCase()}
      </span>
      {control.type === "pills" && (
        <PillsInput
          options={control.options}
          value={value as number}
          unit={control.unit}
          onChange={(v) => onChange(controlKey as keyof T, v)}
        />
      )}
      {control.type === "slider" && (
        <SliderInput
          label={control.label}
          value={value as number}
          min={control.min}
          max={control.max}
          step={control.step}
          unit={control.unit}
          onChange={(v) => onChange(controlKey as keyof T, v)}
        />
      )}
      {control.type === "segmented" && (
        <SegmentedInput
          value={value as string}
          options={control.options}
          onChange={(v) => onChange(controlKey as keyof T, v)}
        />
      )}
      {control.type === "toggle" && (
        <ToggleInput
          value={value as boolean}
          onChange={(v) => onChange(controlKey as keyof T, v)}
        />
      )}
    </div>
  );
}

function PillsInput({
  options,
  value,
  unit,
  onChange,
}: {
  options: readonly number[];
  value: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const format = (v: number) => {
    const base = Number.isInteger(v) ? v.toString() : v.toString();
    return unit ? `${base}${unit}` : base;
  };

  return (
    <div className="h-11 rounded-lg bg-surface p-1 flex items-stretch">
      {options.map((opt, i) => {
        const selected = opt === value;
        return (
          <button
            key={`${opt}-${i}`}
            onClick={() => onChange(opt)}
            className={`flex-1 text-[12px] transition-all duration-150 ${
              selected
                ? "bg-white text-black font-medium rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                : "text-muted/60 hover:text-ink"
            }`}
          >
            {format(opt)}
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const DOTS = 6;

  const decimals = (step.toString().split(".")[1] ?? "").length;
  const format = (v: number) =>
    `${decimals > 0 ? v.toFixed(decimals) : v}${unit ?? ""}`;

  const range = max - min;
  const progress = range === 0 ? 0 : (value - min) / range;

  const updateFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + p * range;
    const snapped = Math.round((raw - min) / step) * step + min;
    const clamped = Math.max(min, Math.min(max, snapped));
    onChange(Number(clamped.toFixed(decimals)));
  };

  return (
    <div className="flex items-stretch h-9 rounded-md bg-surface text-xs select-none">
      <div
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          draggingRef.current = true;
          updateFromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) updateFromPointer(e.clientX);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          draggingRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Number(Math.min(max, value + step).toFixed(decimals)));
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Number(Math.max(min, value - step).toFixed(decimals)));
          }
        }}
        className="flex-1 relative cursor-ew-resize outline-none focus-visible:bg-surface/60 rounded-l-md"
      >
        <div className="absolute inset-0 flex items-center justify-between px-3">
          {Array.from({ length: DOTS }).map((_, i) => (
            <span
              key={i}
              className="w-[2px] h-[2px] rounded-full bg-muted/50"
            />
          ))}
        </div>
        <div
          className="absolute top-2 bottom-2 w-[2px] bg-ink rounded-full pointer-events-none"
          style={{ left: `calc(12px + ${progress} * (100% - 24px + 2px) - 1px)` }}
        />
      </div>
      <div className="flex items-center justify-end pr-3 pl-2 min-w-14 text-ink tabular-nums">
        {format(value)}
      </div>
    </div>
  );
}

function SegmentedInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-surface overflow-hidden">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
            value === option
              ? "bg-accent text-canvas"
              : "text-muted hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ToggleInput({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full relative transition-colors ${
        value ? "bg-accent" : "bg-surface"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-canvas transition-transform ${
          value ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  );
}
