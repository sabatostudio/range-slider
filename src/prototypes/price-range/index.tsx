import { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "./AnimatedNumber";

const MIN = 0;
const MAX = 100;
const MERGE_THRESHOLD = 8;

export function PriceRange() {
  const [value, setValue] = useState<number[]>([20, 80]);
  const [a, b] = value;
  const merged = b - a <= MERGE_THRESHOLD;
  const midPct = (((a + b) / 2 - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[420px]">
          <SliderPrimitive.Root
            value={value}
            onValueChange={setValue}
            min={MIN}
            max={MAX}
            step={1}
            minStepsBetweenThumbs={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-white/15 h-1.5">
              <SliderPrimitive.Range className="absolute bg-white h-full" />
            </SliderPrimitive.Track>

            <AnimatePresence>
              {merged && (
                <motion.div
                  key="merged-label"
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  style={{ left: `${midPct}%`, bottom: "calc(100% + 28px)" }}
                  className="absolute -translate-x-1/2 pointer-events-none"
                >
                  <div className="px-4 py-1.5 rounded-full bg-white text-black text-3xl font-medium tabular-nums whitespace-nowrap">
                    {a}–{b}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {[0, 1].map((i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="group relative block h-5 w-5 shrink-0 focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  style={{ backgroundColor: "#0000FF" }}
                  className="absolute inset-0 rounded-full transition-transform duration-150 ease-out group-hover:scale-[1.2] group-active:scale-[1.1]"
                />
                <motion.span
                  animate={{ opacity: merged ? 0 : 1, y: merged ? 6 : 0 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 text-white text-5xl font-medium tabular-nums pointer-events-none whitespace-nowrap"
                >
                  <AnimatedNumber value={value[i]} variant="Roll" />
                </motion.span>
              </SliderPrimitive.Thumb>
            ))}
          </SliderPrimitive.Root>
        </div>
      </div>
    </div>
  );
}
