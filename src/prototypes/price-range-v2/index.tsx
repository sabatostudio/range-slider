import { useEffect, useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { AnimatedNumber } from "../price-range/AnimatedNumber";

const MIN = 0;
const MAX = 100;
const MERGE_THRESHOLD = 8;

const THUMB_COLOR = "#A463FF";
const RANGE_COLOR = "#5B00DA";

// Match Radix's edge-aware thumb positioning so the merged label tracks
// the geometric midpoint of the dots, not the raw value midpoint.
const THUMB_W = 20;
const TRACK_W = 420;
const HALF_THUMB_FRAC = THUMB_W / 2 / TRACK_W;

const ENTER = { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const };
const MORPH = { duration: 0.22, ease: [0.645, 0.045, 0.355, 1] as const };
const COLOR = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const };
const PRESS = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const };
const RELEASE = { type: "spring", stiffness: 120, damping: 26, mass: 0.9 } as const;

const FONT_MONO = {
  fontFamily: "var(--font-mechanik-mono)",
  fontWeight: 100,
} as const;

function MetaballLabel({
  text,
  positionStyle,
  collapsed,
}: {
  text: string;
  positionStyle: React.CSSProperties;
  collapsed: boolean;
}) {
  const bg = collapsed ? "#ffffff" : THUMB_COLOR;
  const fg = collapsed ? "#000000" : "#ffffff";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 4 }}
      transition={ENTER}
      style={positionStyle}
      className="absolute -translate-x-1/2 pointer-events-none"
    >
      <div className="relative inline-block">
        <div
          aria-hidden
          style={{ filter: "url(#metaball-goo)" }}
          className="flex flex-col items-center"
        >
          <motion.div
            className="px-4 rounded-full text-4xl tabular-nums whitespace-nowrap leading-[36px]"
            style={{
              ...FONT_MONO,
              color: "transparent",
            }}
            animate={{ backgroundColor: bg }}
            transition={COLOR}
          >
            {text}
          </motion.div>
          <motion.div
            className="rounded-full"
            style={{
              width: 14,
              height: 16,
              marginTop: -4,
            }}
            animate={{ backgroundColor: bg }}
            transition={COLOR}
          />
        </div>
        <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none">
          <motion.div
            className="px-4 text-4xl tabular-nums whitespace-nowrap leading-[36px]"
            style={FONT_MONO}
            animate={{ color: fg }}
            transition={COLOR}
          >
            {text}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function getThumbLabelTarget(
  i: number,
  activeIndex: number | null,
  merged: boolean,
) {
  if (merged) return { opacity: 0, y: 6, scale: 1 };
  if (activeIndex === null) return { opacity: 1, y: 0, scale: 1 };
  if (activeIndex === i) return { opacity: 1, y: 0, scale: 1.4 };
  return { opacity: 0.25, y: 0, scale: 0.85 };
}

function getDotScale(i: number, activeIndex: number | null): number {
  if (activeIndex === null) return 1;
  if (activeIndex === i) return 1.2;
  return 0.85;
}

function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return hoverCapable;
}

type CursorVariant = "trail" | "ring" | "crosshair" | "halo" | "off";

function usePointer(hostRef: React.RefObject<HTMLDivElement | null>) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [visible, setVisible] = useState(false);
  const [hot, setHot] = useState(false);
  const [pressed, setPressed] = useState(false);

  const visibleRef = useRef(false);
  const hotRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      const target = e.target as HTMLElement | null;
      const nextHot = !!target?.closest("[role='slider']");
      if (nextHot !== hotRef.current) {
        hotRef.current = nextHot;
        setHot(nextHot);
      }
    };
    const leave = () => {
      visibleRef.current = false;
      setVisible(false);
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [hostRef, x, y]);

  return { x, y, visible, hot, pressed };
}

function CustomCursor({
  hostRef,
  variant,
}: {
  hostRef: React.RefObject<HTMLDivElement | null>;
  variant: CursorVariant;
}) {
  const { x, y, visible, hot, pressed } = usePointer(hostRef);
  const trailX = useSpring(x, { stiffness: 220, damping: 28, mass: 0.6 });
  const trailY = useSpring(y, { stiffness: 220, damping: 28, mass: 0.6 });

  if (variant === "off") return null;

  const baseLayer = "pointer-events-none absolute top-0 left-0 z-50";
  const center = { translateX: "-50%", translateY: "-50%" } as const;

  if (variant === "trail") {
    return (
      <>
        <motion.div
          aria-hidden
          style={{ x, y, ...center, borderColor: THUMB_COLOR }}
          animate={{
            scale: pressed ? 0.85 : hot ? 1.9 : 1,
            opacity: visible ? (hot ? 0.35 : 0.55) : 0,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.5 }}
          className={`${baseLayer} h-8 w-8 rounded-full border mix-blend-difference`}
        />
        <motion.div
          aria-hidden
          style={{ x, y, ...center, backgroundColor: "#ffffff" }}
          animate={{ scale: pressed ? 0.6 : 1, opacity: visible ? (hot ? 0 : 1) : 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={`${baseLayer} h-1.5 w-1.5 rounded-full`}
        />
      </>
    );
  }

  if (variant === "ring") {
    return (
      <motion.div
        aria-hidden
        style={{ x, y, ...center }}
        animate={{
          scale: pressed ? 0.85 : hot ? 1.6 : 1,
          opacity: visible ? 0.7 : 0,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.5 }}
        className={`${baseLayer} h-6 w-6 rounded-full border border-white/80 mix-blend-difference`}
      />
    );
  }

  if (variant === "crosshair") {
    return (
      <>
        <motion.div
          aria-hidden
          style={{ x, y, ...center }}
          animate={{ opacity: visible ? (hot ? 0.85 : 0.5) : 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`${baseLayer} mix-blend-difference`}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-10 bg-white/80" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-10 bg-white/80" />
        </motion.div>
        <motion.div
          aria-hidden
          style={{ x, y, ...center, backgroundColor: "#ffffff" }}
          animate={{ scale: pressed ? 0.5 : 1, opacity: visible ? 0.9 : 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={`${baseLayer} h-1 w-1 rounded-full mix-blend-difference`}
        />
      </>
    );
  }

  // halo
  return (
    <motion.div
      aria-hidden
      style={{
        x: trailX,
        y: trailY,
        ...center,
        backgroundColor: THUMB_COLOR,
        filter: "blur(14px)",
      }}
      animate={{
        scale: pressed ? 0.7 : hot ? 1.4 : 1,
        opacity: visible ? (hot ? 0.25 : 0.5) : 0,
      }}
      transition={{ type: "spring", stiffness: 160, damping: 24, mass: 0.7 }}
      className={`${baseLayer} h-10 w-10 rounded-full`}
    />
  );
}

const CURSOR_OPTIONS: { value: CursorVariant; label: string }[] = [
  { value: "trail", label: "Trail" },
  { value: "ring", label: "Ring" },
  { value: "crosshair", label: "Crosshair" },
  { value: "halo", label: "Halo" },
  { value: "off", label: "Off" },
];

type CancelToken = { cancelled: boolean };

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// ease-in-out-cubic — for on-screen movement between rest states
const EASE_IN_OUT = [0.645, 0.045, 0.355, 1] as const;

const safeAwait = async (controls: { stop: () => void }) => {
  try {
    await Promise.resolve(controls as unknown as PromiseLike<unknown>);
  } catch {
    /* canceled */
  }
};

function useChoreography(
  setValue: (v: number[]) => void,
  setActiveIndex: (i: number | null) => void,
  onPress: (thumbIndex: 0 | 1) => void,
) {
  const a = useMotionValue(20);
  const b = useMotionValue(80);

  useEffect(() => {
    // Pass float values through so thumb + metaball positions animate at
    // sub-pixel resolution. Display code rounds for the visible numbers.
    const sync = () => setValue([a.get(), b.get()]);
    const ua = a.on("change", sync);
    const ub = b.on("change", sync);
    return () => {
      ua();
      ub();
    };
  }, [a, b, setValue]);

  const reset = () => {
    a.stop();
    b.stop();
    a.set(20);
    b.set(80);
    setActiveIndex(null);
    setValue([20, 80]);
  };

  // One full cycle. Starts AND ends in the initial [20, 80] / null state.
  // Each beat moves only ONE thumb. `onPress(i)` fires at the moment of
  // contact so the parent can spawn a ripple from that thumb.
  const playOnce = async (token: CancelToken) => {
    const sleep = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(r, ms);
        if (token.cancelled) clearTimeout(t);
      });
    if (token.cancelled) return;

    await sleep(280); // breath before action
    if (token.cancelled) return;

    // Beat 1 — left thumb crosses up to merge with right at 80, the merged
    // pill translates down to 40, then a cross-axis split sends a back to
    // 20 while b stays anchored at the merge point.
    setActiveIndex(0);
    onPress(0);
    // Approach: ease-in-out so the thumb leaves rest naturally and decelerates
    // into the merge zone, where the metaball forms.
    await safeAwait(animate(a, 73, { duration: 0.9, ease: EASE_IN_OUT }));
    if (token.cancelled) return;
    await sleep(420);

    // Settle into merge: critically damped spring (no bounce) eases the last
    // 7 units to 80 without overshooting past b — keeps the metaball fusion
    // visually clean.
    await safeAwait(
      animate(a, 80, { type: "spring", duration: 0.5, bounce: 0 }),
    );
    if (token.cancelled) return;
    await sleep(380);

    // Translate as one: ease-in-out for on-screen movement between rest states.
    await Promise.all([
      safeAwait(animate(a, 40, { duration: 0.7, ease: EASE_IN_OUT })),
      safeAwait(animate(b, 40, { duration: 0.7, ease: EASE_IN_OUT })),
    ]);
    if (token.cancelled) return;
    await sleep(440);

    // Cross-axis split: same critically-damped character as the merge
    // collapse, duration scaled to the longer distance so the perceived
    // speed (and cadence) matches.
    await safeAwait(
      animate(a, 20, { type: "spring", duration: 0.85, bounce: 0 }),
    );
    if (token.cancelled) return;
    await sleep(400);

    setActiveIndex(null);

    // Return home: ease-in-out to soft-land the loop seam.
    await safeAwait(animate(b, 80, { duration: 0.7, ease: EASE_IN_OUT }));
    if (token.cancelled) return;
    await sleep(280);
  };

  return { reset, playOnce };
}

// ease-out-quart — refined exit motion (Emil Kowalski / animations.dev)
const RIPPLE_EASE = [0.165, 0.84, 0.44, 1] as const;

function ThumbRipple({ fireKey }: { fireKey: number }) {
  const reduce = useReducedMotion();
  if (fireKey === 0) return null;

  if (reduce) {
    // Reduced-motion fallback: a brief, scale-free opacity flash
    return (
      <motion.span
        key={fireKey}
        aria-hidden
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "linear" }}
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          backgroundColor: "transparent",
          boxShadow: `0 0 0 2px ${THUMB_COLOR}`,
        }}
      />
    );
  }

  return (
    <motion.span
      key={fireKey}
      aria-hidden
      initial={{ scale: 1, opacity: 0.85 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{
        duration: 0.5,
        ease: RIPPLE_EASE,
        opacity: { duration: 0.45, ease: RIPPLE_EASE },
      }}
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        backgroundColor: "transparent",
        boxShadow: `0 0 0 2px ${THUMB_COLOR}`,
        willChange: "transform, opacity",
      }}
    />
  );
}

function useAutoplay({
  enabled,
  reset,
  playOnce,
}: {
  enabled: boolean;
  reset: () => void;
  playOnce: (token: CancelToken) => Promise<void>;
}) {
  useEffect(() => {
    if (!enabled) return;
    const token: CancelToken = { cancelled: false };
    reset();
    (async () => {
      while (!token.cancelled) {
        await playOnce(token);
        if (token.cancelled) return;
        // pause between cycles
        await new Promise((r) => setTimeout(r, 450));
      }
    })();
    return () => {
      token.cancelled = true;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

type RecordOpts = {
  /** Source crop side length in CSS pixels (square, viewport-centered). */
  cropSize?: number;
  /** Output square side length in pixels. */
  outSize?: number;
  /** Encoder bitrate. */
  bitrate?: number;
  run: () => Promise<void>;
};

function pickMime(): { mime: string; ext: "mp4" | "webm" } {
  const candidates: { mime: string; ext: "mp4" | "webm" }[] = [
    { mime: "video/mp4;codecs=avc1.640034", ext: "mp4" },
    { mime: "video/mp4;codecs=avc1.42E01F", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

/**
 * Record a square crop of the host element to MP4 with strict constant
 * framerate.
 *
 * Why CFR matters: social platform encoders (LinkedIn, X, IG) assume the
 * input is CFR. A `MediaRecorder` driven by `canvas.captureStream(60)` and
 * `requestVideoFrameCallback` produces a *variable* framerate file because
 * frames emit when they happen, not on a fixed clock. The result plays fine
 * locally but stutters after a re-encode.
 *
 * The fix: drive the canvas with a manual frame clock at exactly TARGET_FPS
 * via `setTimeout` corrected against `performance.now()`, and emit frames
 * with `track.requestFrame()` from a `captureStream(0)` (manual mode). Every
 * output frame has a clean 1/TARGET_FPS timestamp.
 */
async function recordHostElement(host: HTMLElement, opts: RecordOpts) {
  const {
    run,
    cropSize = 900,
    outSize = 1080,
    bitrate = 12_000_000,
  } = opts;
  const TARGET_FPS = 30; // matches social platforms' feed re-encode target

  if (!navigator.mediaDevices?.getDisplayMedia) {
    alert("Screen recording not supported in this browser.");
    return;
  }

  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    preferCurrentTab: true,
    video: { frameRate: 60, cursor: "never" },
    audio: false,
  } as DisplayMediaStreamOptions & {
    preferCurrentTab?: boolean;
    video?: { frameRate?: number; cursor?: "always" | "motion" | "never" };
  });

  const video = document.createElement("video");
  video.srcObject = displayStream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  await new Promise<void>((resolve) => {
    if (video.videoWidth > 0) return resolve();
    video.onloadedmetadata = () => resolve();
  });

  // Wait for Chrome's "Sharing this tab" bar to finish sliding in.
  await new Promise((r) => setTimeout(r, 700));

  // Compute the host-centered square crop in video-pixel coordinates.
  const scaleX = video.videoWidth / window.innerWidth;
  const scaleY = video.videoHeight / window.innerHeight;
  const rect = host.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const sx = (cx - cropSize / 2) * scaleX;
  const sy = (cy - cropSize / 2) * scaleY;
  const sw = cropSize * scaleX;
  const sh = cropSize * scaleY;

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    displayStream.getTracks().forEach((t) => t.stop());
    return;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Manual-mode capture: we control frame emission via requestFrame().
  type ManualTrack = MediaStreamTrack & { requestFrame?: () => void };
  const canvasStream = (
    canvas as HTMLCanvasElement & {
      captureStream: (frameRequestRate?: number) => MediaStream;
    }
  ).captureStream(0);
  const track = canvasStream.getVideoTracks()[0] as ManualTrack;

  const { mime, ext } = pickMime();
  const rec = new MediaRecorder(canvasStream, {
    ...(mime ? { mimeType: mime } : {}),
    videoBitsPerSecond: bitrate,
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopPromise = new Promise<void>((r) => (rec.onstop = () => r()));

  // Prime: paint and emit the first frame before MediaRecorder starts so
  // byte 0 of the encoded stream is the initial state of the prototype.
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outSize, outSize);

  // Drift-free frame clock: each tick paints the latest video frame and
  // requests one canvas frame. Timestamps land at exact 1/TARGET_FPS spacing.
  const frameInterval = 1000 / TARGET_FPS;
  let stopped = false;
  let nextTick = performance.now();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const tick = () => {
    if (stopped) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outSize, outSize);
    track.requestFrame?.();
    nextTick += frameInterval;
    const delay = Math.max(0, nextTick - performance.now());
    timer = setTimeout(tick, delay);
  };

  rec.start();
  // Start the clock immediately after rec.start() so the recorder receives
  // a steady stream from frame 0.
  nextTick = performance.now() + frameInterval;
  timer = setTimeout(tick, frameInterval);

  // One cycle — start frame == end frame for a seamless loop.
  await run();

  // Stop the clock before stopping the recorder so no straggler frames slip
  // in with mistimed timestamps.
  stopped = true;
  if (timer) clearTimeout(timer);
  rec.stop();
  await stopPromise;
  displayStream.getTracks().forEach((t) => t.stop());
  canvasStream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: mime || "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `range-slider-${Date.now()}.${ext}`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

function Toolbar({
  autoplay,
  onAutoplay,
  recording,
  onRecord,
}: {
  autoplay: boolean;
  onAutoplay: (v: boolean) => void;
  recording: boolean;
  onRecord: () => void;
}) {
  const btn =
    "appearance-none bg-transparent border border-white/15 hover:border-white/35 focus:border-white/60 focus:outline-none rounded-full px-3 py-1 text-white/80 text-[11px] tracking-[0.08em] cursor-pointer transition-colors";
  return (
    <div className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/50 text-[11px] uppercase tracking-[0.12em] font-mono">
      <button
        type="button"
        className={btn}
        onClick={() => onAutoplay(!autoplay)}
        aria-pressed={autoplay}
      >
        {autoplay ? "■ Stop" : "▶ Auto"}
      </button>
      <button
        type="button"
        className={btn}
        onClick={onRecord}
        disabled={recording}
        style={recording ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        {recording ? "● Rec…" : "● Record"}
      </button>
    </div>
  );
}

function SoloToolbar({
  autoplay,
  onAutoplay,
  recording,
  onRecord,
}: {
  autoplay: boolean;
  onAutoplay: (v: boolean) => void;
  recording: boolean;
  onRecord: () => void;
}) {
  const tile =
    "group relative size-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="absolute bottom-5 right-5 z-50 flex items-center gap-0.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        className={tile}
        onClick={() => onAutoplay(!autoplay)}
        aria-pressed={autoplay}
        aria-label={autoplay ? "Stop autoplay" : "Start autoplay"}
      >
        {autoplay ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden
          >
            <rect x="3" y="2.5" width="2.5" height="9" rx="0.6" />
            <rect x="8.5" y="2.5" width="2.5" height="9" rx="0.6" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden
          >
            <path d="M3.6 2.4 L11.4 7 L3.6 11.6 Z" />
          </svg>
        )}
      </button>
      <div className="h-5 w-px bg-white/10" aria-hidden />
      <button
        type="button"
        className={tile}
        onClick={onRecord}
        disabled={recording}
        aria-label={recording ? "Recording" : "Record"}
      >
        <span className="relative flex items-center justify-center">
          <span
            className={`size-2.5 rounded-full ${
              recording ? "bg-red-500" : "bg-current"
            }`}
          />
          {recording && (
            <span className="absolute size-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
          )}
        </span>
      </button>
    </div>
  );
}

function CursorPicker({
  value,
  onChange,
}: {
  value: CursorVariant;
  onChange: (v: CursorVariant) => void;
}) {
  return (
    <label className="absolute top-6 right-6 z-50 flex items-center gap-2 text-white/50 text-[11px] uppercase tracking-[0.12em] font-mono">
      <span className="select-none">Cursor</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CursorVariant)}
        className="appearance-none bg-transparent border border-white/15 hover:border-white/35 focus:border-white/60 focus:outline-none rounded-full px-3 py-1 text-white/80 text-[11px] tracking-[0.08em] cursor-pointer transition-colors"
        style={{ colorScheme: "dark" }}
      >
        {CURSOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-black text-white">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PriceRangeV2() {
  const [value, setValue] = useState<number[]>([20, 80]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [cursor, setCursor] = useState<CursorVariant>("trail");
  const [autoplay, setAutoplay] = useState(false);
  const [recording, setRecording] = useState(false);
  const reduce = useReducedMotion();
  const hoverCapable = useHoverCapable();
  const hostRef = useRef<HTMLDivElement>(null);

  const [ripple, setRipple] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });

  // Cross-axis split: a vertical pull past CROSS_AXIS_THRESHOLD while the
  // pill is merged mid-drag arms the split. Once armed, the rest of the
  // gesture stays split — active thumb follows the cursor, the other stays
  // at the merge point.
  const mergeAnchorYRef = useRef<number | null>(null);
  const lastPointerYRef = useRef<number | null>(null);
  const splitArmedRef = useRef(false);
  const mergeAnchoredRef = useRef(false);
  const CROSS_AXIS_THRESHOLD = 30;

  useEffect(() => {
    if (activeIndex === null) {
      mergeAnchorYRef.current = null;
      lastPointerYRef.current = null;
      splitArmedRef.current = false;
      mergeAnchoredRef.current = false;
      return;
    }
    const onMove = (e: PointerEvent) => {
      lastPointerYRef.current = e.clientY;
      if (
        mergeAnchorYRef.current !== null &&
        !splitArmedRef.current &&
        Math.abs(e.clientY - mergeAnchorYRef.current) > CROSS_AXIS_THRESHOLD
      ) {
        splitArmedRef.current = true;
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [activeIndex]);

  const handlePress = (i: 0 | 1) => {
    setRipple((r) =>
      i === 0 ? { ...r, left: r.left + 1 } : { ...r, right: r.right + 1 },
    );
  };
  const { reset, playOnce } = useChoreography(
    setValue,
    setActiveIndex,
    handlePress,
  );
  useAutoplay({ enabled: autoplay, reset, playOnce });
  const choreographyActive = autoplay || recording;

  const handleRecord = async () => {
    if (recording) return;
    if (!hostRef.current) return;
    setAutoplay(false);
    setRecording(true);
    try {
      reset();
      // give React a tick to hide the toolbar and render initial state
      await new Promise((r) => setTimeout(r, 80));
      const token: CancelToken = { cancelled: false };
      const dwell = (ms: number) =>
        new Promise<void>((r) => setTimeout(r, ms));
      await recordHostElement(hostRef.current, {
        cropSize: 692,
        outSize: 1080,
        // 12 Mbps at 30fps is well above what social platforms keep, leaves
        // them clean source material to re-encode without heroic decisions.
        bitrate: 12_000_000,
        run: async () => {
          // brief hold on the start frame so wrap-around feels intentional
          await dwell(350);
          for (let i = 0; i < 2; i++) {
            if (token.cancelled) return;
            await playOnce(token);
            if (i < 1) await dwell(350);
          }
          // close the loop with a matching tail dwell
          await dwell(350);
        },
      });
    } finally {
      setRecording(false);
    }
  };

  const [a, b] = value;
  const merged = b - a <= MERGE_THRESHOLD;
  // Float-precise positions for smooth visuals, rounded ints for displayed text.
  const ra = Math.round(a);
  const rb = Math.round(b);
  const collapsed = ra === rb;
  const rawMidFrac = ((a + b) / 2 - MIN) / (MAX - MIN);
  const midPct =
    (HALF_THUMB_FRAC + (1 - 2 * HALF_THUMB_FRAC) * rawMidFrac) * 100;
  const labelText = collapsed ? String(ra) : `${ra}-${rb}`;

  useEffect(() => {
    if (activeIndex === null) return;
    const clear = () => setActiveIndex(null);
    window.addEventListener("pointerup", clear);
    window.addEventListener("pointercancel", clear);
    return () => {
      window.removeEventListener("pointerup", clear);
      window.removeEventListener("pointercancel", clear);
    };
  }, [activeIndex]);

  return (
    <div
      ref={hostRef}
      className="relative h-full overflow-hidden"
      style={{
        backgroundColor: "#000000",
        cursor: choreographyActive
          ? "none"
          : cursor === "off"
            ? "auto"
            : "none",
      }}
    >
      {!recording &&
        (typeof window !== "undefined" &&
        window.location.pathname.startsWith("/solo/") ? (
          <SoloToolbar
            autoplay={autoplay}
            onAutoplay={setAutoplay}
            recording={recording}
            onRecord={handleRecord}
          />
        ) : (
          <Toolbar
            autoplay={autoplay}
            onAutoplay={setAutoplay}
            recording={recording}
            onRecord={handleRecord}
          />
        ))}
      {hoverCapable && !choreographyActive && (
        <CustomCursor hostRef={hostRef} variant={cursor} />
      )}
      <svg
        width="0"
        height="0"
        aria-hidden
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <filter
            id="metaball-goo"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
            <feColorMatrix
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
            />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[420px]">
          <SliderPrimitive.Root
            value={value}
            onValueChange={(next) => {
              setValue((prev) => {
                // Collapsed state. Released gestures split via `next` as
                // normal. Mid-drag, the merged value translates as one until
                // a cross-axis pull arms the split.
                if (prev[0] === prev[1]) {
                  if (activeIndex === null) return next;
                  const v = prev[0];
                  if (!mergeAnchoredRef.current) {
                    mergeAnchoredRef.current = true;
                    mergeAnchorYRef.current = lastPointerYRef.current;
                  }
                  if (splitArmedRef.current) {
                    if (activeIndex === 1) {
                      return [v, Math.max(next[0], next[1], v)];
                    }
                    if (activeIndex === 0) {
                      return [Math.min(next[0], next[1], v), v];
                    }
                  }
                  const d0 = next[0] - v;
                  const d1 = next[1] - v;
                  const delta = Math.abs(d0) > Math.abs(d1) ? d0 : d1;
                  const nv = Math.max(MIN, Math.min(MAX, v + delta));
                  return [nv, nv];
                }
                // Collapse-on-cross: only when not already collapsed
                if (activeIndex === 0 && next[0] === prev[1] && next[1] !== prev[1]) {
                  return [next[1], next[1]];
                }
                if (activeIndex === 1 && next[1] === prev[0] && next[0] !== prev[0]) {
                  return [next[0], next[0]];
                }
                return next;
              });
            }}
            min={MIN}
            max={MAX}
            step={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-white/25 h-1.5">
              <SliderPrimitive.Range
                className="absolute h-full"
                style={{ backgroundColor: RANGE_COLOR }}
              />
            </SliderPrimitive.Track>

            <AnimatePresence>
              {merged && (
                <MetaballLabel
                  key="merged"
                  text={labelText}
                  collapsed={collapsed}
                  positionStyle={{
                    left: `${midPct}%`,
                    bottom: "calc(100% + 19px)",
                  }}
                />
              )}
            </AnimatePresence>

            {[0, 1].map((i) => {
              const isActive = activeIndex === i;
              const dotTarget = reduce
                ? { scale: 1 }
                : { scale: getDotScale(i, activeIndex) };
              const labelTarget = reduce
                ? { opacity: merged ? 0 : 1, y: 0, scale: 1 }
                : getThumbLabelTarget(i, activeIndex, merged);
              const motionTransition = reduce
                ? MORPH
                : isActive
                  ? PRESS
                  : RELEASE;
              // Hard-cut the individual labels the moment we cross into the
              // merged state — eliminates the cross-fade smear with the pill.
              const labelTransition = merged
                ? { duration: 0.06, ease: "linear" as const }
                : motionTransition;
              return (
                <SliderPrimitive.Thumb
                  key={i}
                  onPointerDown={() => {
                    setAutoplay(false);
                    setActiveIndex(i);
                  }}
                  className="group relative block h-5 w-5 shrink-0 focus-visible:outline-none"
                >
                  <ThumbRipple fireKey={i === 0 ? ripple.left : ripple.right} />
                  <motion.span
                    aria-hidden
                    style={{
                      backgroundColor: THUMB_COLOR,
                      originX: 0.5,
                      originY: 0.5,
                    }}
                    animate={dotTarget}
                    whileHover={
                      reduce || !hoverCapable ? undefined : { scale: 1.15 }
                    }
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                    transition={motionTransition}
                    className="absolute inset-0 rounded-full"
                  />
                  <motion.span
                    animate={labelTarget}
                    transition={labelTransition}
                    style={{
                      ...FONT_MONO,
                      transformOrigin: "50% 100%",
                    }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 text-white text-4xl tabular-nums pointer-events-none whitespace-nowrap leading-none"
                  >
                    <AnimatedNumber value={Math.round(value[i])} variant="Roll" />
                  </motion.span>
                </SliderPrimitive.Thumb>
              );
            })}
          </SliderPrimitive.Root>
        </div>
      </div>
    </div>
  );
}
