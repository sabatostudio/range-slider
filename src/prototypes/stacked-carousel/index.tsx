import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
  type PanInfo,
} from "motion/react";
import { useSearchParams } from "react-router-dom";
import { useControls, Sidebar } from "../../controls";
import { schema } from "./controls";
import {
  PRESETS,
  PRESET_ORDER,
  matchPreset,
  type PresetId,
} from "./presets";

const CARDS = [
  { id: 1, color: "#ffffff" },
  { id: 2, color: "#ffffff" },
  { id: 3, color: "#ffffff" },
];

interface CardHandle {
  swipe: (direction: 1 | -1) => void;
}

type Spring = {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
};
type Tween = {
  type: "tween";
  duration: number;
  ease: [number, number, number, number];
};
type MorphTransition = Spring | Tween;

type StackDirection = "up" | "down" | "left" | "right";

const STACK_SPACING: Record<string, number> = {
  tight: 16,
  regular: 32,
  loose: 52,
};
const STACK_SCALE = 0.88;
const SWIPE_THRESHOLD = 100;

const KNOB_KEYS = [
  "stiffness",
  "damping",
  "mass",
  "exitDuration",
  "dragRotation",
] as const;

export function StackedCarousel() {
  const [values] = useControls(schema);
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(() => CARDS.map((_, i) => i));

  // Resolve active preset: explicit ?preset= wins (so Cinematic's tween sticks),
  // otherwise derive from current values so defaults map to Smooth.
  const presetParam = searchParams.get("preset") as PresetId | null;
  const activePreset: PresetId | "custom" =
    presetParam && presetParam in PRESETS
      ? presetParam
      : (matchPreset(values) ?? "custom");

  const applyPreset = useCallback(
    (id: PresetId) => {
      const preset = PRESETS[id];
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("preset", id);
        for (const k of KNOB_KEYS) {
          const def = schema[k].default;
          const v = preset.values[k];
          if (v === def) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setValue = useCallback(
    (key: keyof typeof schema, value: number | string | boolean) => {
      // Single setSearchParams call — react-router doesn't queue sequential
      // functional updates like useState does, so two calls would race.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const control = schema[key];
        if (value === control.default) {
          next.delete(key as string);
        } else {
          next.set(key as string, String(value));
        }
        if ((KNOB_KEYS as readonly string[]).includes(key as string)) {
          next.delete("preset");
        }
        return next;
      });
    },
    [setSearchParams],
  );
  // Holds the id of the card that just swiped off, so it snaps (no spring)
  // from front to back on the single render right after the swipe.
  const justSwipedIdRef = useRef<number | null>(null);
  const cardHandles = useRef<Record<number, CardHandle | null>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    justSwipedIdRef.current = null;
  });

  const prefersReduced = useReducedMotion() ?? false;

  const spring = {
    type: "spring" as const,
    stiffness: values.stiffness,
    damping: values.damping,
    mass: values.mass,
  };

  // Cinematic swaps the stack morph (open/close + shuffle) to a tween with
  // ease-in-out-expo. Drag-return stays on spring (interruptible gestures need it).
  const cinematic =
    activePreset === "cinematic" ? PRESETS.cinematic.tween : undefined;
  const morphTransition: MorphTransition = cinematic
    ? { type: "tween", duration: cinematic.duration, ease: cinematic.ease }
    : spring;

  const sendToBack = useCallback(() => {
    setOrder((prev) => {
      const next = [...prev];
      const front = next.shift()!;
      next.push(front);
      return next;
    });
  }, []);

  const handleSwipeOff = useCallback(() => {
    justSwipedIdRef.current = CARDS[order[0]].id;
    sendToBack();
  }, [order, sendToBack]);

  // Keyboard support: trigger the same swipe-off animation as a drag
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const frontId = CARDS[order[0]].id;
      const handle = cardHandles.current[frontId];
      if (!handle) return;
      if (e.key === "ArrowRight") handle.swipe(1);
      if (e.key === "ArrowLeft") handle.swipe(-1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [order]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Floating Sidebar */}
      <div
        style={{ borderRadius: 22, width: 288, maxHeight: "calc(100vh - 140px)" }}
        className="absolute top-16 left-6 z-20 bg-canvas shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="overflow-y-auto no-scrollbar">
          <Sidebar
            schema={schema}
            values={values}
            onChange={setValue}
            afterSection={{
              LAYOUT: (
                <PresetPicker active={activePreset} onPick={applyPreset} />
              ),
            }}
          />
        </div>
      </div>

      {/* Canvas — full area; sidebar floats over it */}
      <div
        ref={canvasRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-none"
      >
        <BackgroundTint
          color={CARDS[order[0]].color}
          active={values.tintBackground === "On"}
          transition={morphTransition}
          reduced={prefersReduced}
        />
        <CustomCursor containerRef={canvasRef} />
        <div className="relative w-72 h-96">
          {order.map((cardIndex, stackPosition) => {
            const id = CARDS[cardIndex].id;
            return (
              <Card
                key={id}
                ref={(h) => {
                  cardHandles.current[id] = h;
                }}
                color={CARDS[cardIndex].color}
                stackPosition={stackPosition}
                isFront={stackPosition === 0}
                offset={STACK_SPACING[values.stackSpacing] ?? STACK_SPACING.regular}
                direction={values.stackDirection as StackDirection}
                scale={STACK_SCALE}
                swipeThreshold={SWIPE_THRESHOLD}
                dragRotation={values.dragRotation}
                exitDuration={values.exitDuration}
                depthBlur={values.depthBlur === "On"}
                spring={spring}
                morphTransition={morphTransition}
                prefersReduced={prefersReduced}
                skipTransition={id === justSwipedIdRef.current}
                onSwipe={handleSwipeOff}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  color: string;
  stackPosition: number;
  isFront: boolean;
  offset: number;
  direction: StackDirection;
  scale: number;
  swipeThreshold: number;
  dragRotation: number;
  exitDuration: number;
  depthBlur: boolean;
  spring: { type: "spring"; stiffness: number; damping: number; mass: number };
  morphTransition: MorphTransition;
  prefersReduced: boolean;
  skipTransition: boolean;
  onSwipe: () => void;
}

const Card = forwardRef<CardHandle, CardProps>(function Card(
  {
    color,
    stackPosition,
    isFront,
    offset,
    direction,
    scale,
    swipeThreshold,
    dragRotation,
    exitDuration,
    depthBlur,
    spring,
    morphTransition,
    prefersReduced,
    skipTransition,
    onSwipe,
  },
  ref,
) {
  const x = useMotionValue(0);
  const lift = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-dragRotation, dragRotation]);
  const isSwiping = useRef(false);

  // Reset x/lift when card leaves the front position
  useEffect(() => {
    if (!isFront && !isSwiping.current) {
      x.set(0);
      lift.set(0);
    }
  }, [isFront, x, lift]);

  const runSwipeOff = useCallback(
    (direction: 1 | -1) => {
      if (isSwiping.current) return;
      isSwiping.current = true;
      const exit = {
        duration: exitDuration,
        ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
      };
      animate(x, direction * 350, {
        ...exit,
        onComplete: () => {
          isSwiping.current = false;
          onSwipe();
        },
      });
      animate(lift, [0, -20, 0], { duration: exitDuration, ease: "easeOut" });
    },
    [x, lift, onSwipe, exitDuration],
  );

  useImperativeHandle(
    ref,
    () => ({
      swipe(direction) {
        if (!isFront) return;
        runSwipeOff(direction);
      },
    }),
    [isFront, runSwipeOff],
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? 1 : -1;
      runSwipeOff(direction);
    } else {
      animate(x, 0, spring);
    }
  }

  const s = Math.pow(scale, stackPosition);
  const zIndex = CARDS.length - stackPosition;

  // Stack offset along the chosen axis.
  const isHorizontalStack = direction === "left" || direction === "right";
  const stackSign = direction === "up" || direction === "left" ? -1 : 1;
  const targetX = isHorizontalStack ? stackPosition * offset * stackSign : 0;
  const targetY = isHorizontalStack ? 0 : stackPosition * offset * stackSign;

  const canDrag = isFront;
  const transition =
    skipTransition || prefersReduced ? { duration: 0 } : morphTransition;

  // Depth-of-field: cards further back blur more. Kept under 10px since
  // heavy blurs tank perf, especially in Safari (Emil's guidance).
  const targetBlur = depthBlur ? stackPosition * 4 : 0;

  // Framer Motion's spring transitions don't apply to `filter` strings — they
  // silently fall back to tween. To make the blur respect animation presets,
  // drive a numeric motion value and compose the filter via useTransform.
  const blurMV = useMotionValue(targetBlur);
  const filter = useTransform(blurMV, (v) => `blur(${Math.max(0, v)}px)`);
  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  useEffect(() => {
    if (prefersReduced) {
      blurMV.set(targetBlur);
      return;
    }
    const controls = animate(blurMV, targetBlur, transitionRef.current);
    return () => controls.stop();
  }, [targetBlur, blurMV, prefersReduced]);

  return (
    <motion.div style={{ y: lift, zIndex }} className="absolute inset-0">
      <motion.div
        animate={{
          x: targetX,
          y: targetY,
          scale: s,
        }}
        style={{ filter }}
        transition={transition}
        className="absolute inset-0"
      >
        <motion.div
          style={{
            x: canDrag ? x : 0,
            rotate: canDrag ? rotate : 0,
            backgroundColor: color,
            willChange: canDrag ? "transform" : undefined,
          }}
          drag={canDrag ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={canDrag ? handleDragEnd : undefined}
          className="absolute inset-0 rounded-2xl shadow-lg"
        />
      </motion.div>
    </motion.div>
  );
});

function darken(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function CustomCursor({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const SIZE = 36;
  const HALF = SIZE / 2;
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Skip on touch devices — no persistent cursor concept.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX - HALF);
      y.set(e.clientY - HALF);
    };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    // Window-level press so release-outside still resets scale.
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [containerRef, x, y]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 rounded-full"
      style={{
        x,
        y,
        width: SIZE,
        height: SIZE,
        backgroundColor: "rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        mixBlendMode: "difference",
      }}
      animate={{
        scale: pressed ? 0.65 : 1,
        opacity: visible ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
    />
  );
}

function BackgroundTint({
  color,
  active,
  transition,
  reduced,
}: {
  color: string;
  active: boolean;
  transition: MorphTransition;
  reduced: boolean;
}) {
  // Drive backgroundColor via motion value so the preset transition actually
  // applies — same trick we use for blur. Animating transparency ↔ color keeps
  // the off-state clean without relying on conditional rendering.
  const target = active ? darken(color, 0.25) : "rgba(0, 0, 0, 0)";
  const bgMV = useMotionValue(target);
  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  useEffect(() => {
    // Reduced motion: snap to target, no animation.
    if (reduced) {
      bgMV.set(target);
      return;
    }
    const controls = animate(bgMV, target, transitionRef.current);
    return () => controls.stop();
  }, [target, bgMV, reduced]);
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: bgMV }}
    />
  );
}

function PresetPicker({
  active,
  onPick,
}: {
  active: PresetId | "custom";
  onPick: (id: PresetId) => void;
}) {
  return (
    <section className="px-5 pt-5 pb-5 border-t border-surface">
      <div className="text-[11px] tracking-[0.14em] text-ink/80 pb-3">
        ANIMATION PRESET
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PRESET_ORDER.map((id) => {
          const selected = active === id;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className={`h-9 rounded-md text-[11px] transition-colors ${
                selected
                  ? "bg-white text-black font-medium shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                  : "bg-surface text-muted/70 hover:text-ink"
              }`}
            >
              {PRESETS[id].label}
            </button>
          );
        })}
      </div>
      {active === "custom" && (
        <div className="mt-2 text-[10px] tracking-[0.14em] text-muted/70">
          CUSTOM
        </div>
      )}
    </section>
  );
}
