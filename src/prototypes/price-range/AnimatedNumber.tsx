import { useEffect, useRef } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
} from "motion/react";
import type { AnimationVariant } from "./controls";

export function AnimatedNumber({
  value,
  variant,
}: {
  value: number;
  variant: AnimationVariant;
}) {
  const v = Math.round(value);
  switch (variant) {
    case "Tween":
      return <TweenNumber value={v} />;
    case "Spring":
      return <SpringNumber value={v} />;
    case "Roll":
      return <OdometerNumber value={v} />;
    case "Fade":
      return <CrossfadeNumber value={v} />;
    case "Pulse":
      return <PulseNumber value={v} />;
    default:
      return <span>{v}</span>;
  }
}

/**
 * Tween — interpolates the numeric value over ~180ms with ease-out.
 * Classic "countdown" feel. Updates DOM imperatively so rapid drag changes
 * don't flood React with re-renders.
 */
function TweenNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);

  useEffect(() => {
    const unsub = mv.on("change", (latest) => {
      if (ref.current) ref.current.textContent = String(Math.round(latest));
    });
    return unsub;
  }, [mv]);

  useEffect(() => {
    const controls = animate(mv, value, {
      type: "tween",
      duration: 0.18,
      ease: [0.23, 1, 0.32, 1], // ease-out-quint
    });
    return () => controls.stop();
  }, [value, mv]);

  return <span ref={ref}>{value}</span>;
}

/**
 * Spring — same principle, driven by spring physics. Can briefly overshoot.
 * Feels "alive" but can read imprecise at settle edges.
 */
function SpringNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);

  useEffect(() => {
    const unsub = mv.on("change", (latest) => {
      if (ref.current) ref.current.textContent = String(Math.round(latest));
    });
    return unsub;
  }, [mv]);

  useEffect(() => {
    const controls = animate(mv, value, {
      type: "spring",
      stiffness: 180,
      damping: 18,
      mass: 0.8,
    });
    return () => controls.stop();
  }, [value, mv]);

  return <span ref={ref}>{value}</span>;
}

/**
 * Odometer — each digit is a vertical column, translates to the target digit.
 * Transforms only (no paint) so it's cheap even during rapid drag.
 */
function OdometerNumber({ value }: { value: number }) {
  const digits = String(value).split("").map(Number);
  return (
    <span className="inline-flex leading-none">
      {digits.map((d, i) => (
        // Key by position from right so digit columns stay stable across
        // width changes (e.g. 9 → 10, 100 → 99).
        <OdometerDigit key={digits.length - 1 - i} digit={d} />
      ))}
    </span>
  );
}

function OdometerDigit({ digit }: { digit: number }) {
  return (
    <span
      className="inline-block overflow-hidden align-top"
      style={{ height: "1em" }}
    >
      <motion.span
        className="block"
        animate={{ y: `-${digit}em` }}
        transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.6 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block" style={{ height: "1em" }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Crossfade — old value blurs+fades out, new blurs+fades in.
 * Elegant swap, not a countdown. Works well for less frequent changes.
 */
function CrossfadeNumber({ value }: { value: number }) {
  return (
    <span className="relative inline-block">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(6px)", y: -6 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Pulse — value snaps, but the element briefly scales. Minimal,
 * more of an acknowledgement than a count.
 */
function PulseNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const controls = animate(
      ref.current,
      { scale: [1, 1.1, 1] },
      { duration: 0.22, times: [0, 0.35, 1], ease: "easeOut" },
    );
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className="inline-block">
      {value}
    </span>
  );
}
