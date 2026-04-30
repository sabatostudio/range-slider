import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface SliderProps
  extends React.ComponentProps<typeof SliderPrimitive.Root> {
  thumbLabels?: (value: number, index: number) => React.ReactNode;
}

export function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-white/15 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:h-full"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-white data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, i) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={i}
          className="group relative block h-5 w-5 shrink-0 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          {/* Only the circle scales on hover — label stays steady. */}
          {/* Emil: hover = ease, micro-interactions ~150ms. */}
          <span
            aria-hidden
            style={{ backgroundColor: "#0000FF" }}
            className="absolute inset-0 rounded-full transition-transform duration-150 ease-out group-hover:scale-[1.2] group-active:scale-[1.1]"
          />
          {thumbLabels && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 text-white text-5xl font-medium tabular-nums pointer-events-none whitespace-nowrap">
              {thumbLabels(_values[i], i)}
            </span>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
}
