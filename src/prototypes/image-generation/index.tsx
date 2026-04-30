import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type SelectionBox = {
  top: number;
  left: number;
};

const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function ImageGeneration() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<SelectionBox | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const computeFromSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
      if (!el || !root.contains(el)) return;
      const rect = range.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      setBox({
        top: rect.top - rootRect.top + root.scrollTop,
        left: rect.left - rootRect.left + rect.width / 2,
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      setBox(null);
    };
    const onMouseUp = () => {
      setTimeout(computeFromSelection, 0);
    };

    root.addEventListener("mousedown", onMouseDown);
    root.addEventListener("mouseup", onMouseUp);
    return () => {
      root.removeEventListener("mousedown", onMouseDown);
      root.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!box) return;
    setProgress(0);
    let raf = 0;
    const start = performance.now();
    const duration = 4200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [box]);

  return (
    <div
      ref={rootRef}
      className="image-gen-root relative h-full overflow-y-auto flex items-start justify-center px-8 py-16"
      style={{ backgroundColor: "#ffffff" }}
    >
      <style>{`
        .image-gen-root ::selection {
          background-color: #e4fa00;
          color: #000000;
        }
        .image-gen-root ::-moz-selection {
          background-color: #e4fa00;
          color: #000000;
        }
      `}</style>

      <p
        className="text-black max-w-2xl text-center"
        style={{
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, 'URW Palladio L', Georgia, 'Source Serif Pro', ui-serif, serif",
          fontSize: "24px",
          lineHeight: "32px",
          fontWeight: 400,
          letterSpacing: "-0.005em",
        }}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum. Curabitur pretium tincidunt lacus, nulla
        gravida orci a odio. Nullam varius, turpis et commodo pharetra, est
        eros bibendum elit, nec luctus magna felis sollicitudin mauris.
        Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus
        vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut
        ullamcorper, ligula eu tempor congue, eros est euismod turpis, id
        tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec
        fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet
        nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut
        dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus
        eget erat. Cras mollis scelerisque nunc. Nullam arcu.
      </p>

      <AnimatePresence>
        {box && (
          <motion.div
            ref={panelRef}
            key="generation-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.215, 0.61, 0.355, 1] }}
            style={{
              position: "absolute",
              top: box.top - 16,
              left: box.left,
              transform: "translate(-50%, -100%)",
              width: 380,
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              borderRadius: 28,
              padding: 10,
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(0, 0, 0, 0.08)",
              fontFamily: SANS,
            }}
            className="z-10"
          >
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: 20,
                aspectRatio: "1 / 1",
                backgroundColor: "#3a3a3a",
              }}
            >
              <DotGridOverlay active={progress < 100} />

              <div
                className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: 999,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <Spinner />
                <span>{progress < 100 ? "Generating image" : "Done"}</span>
                <span style={{ opacity: 0.7 }}>{progress}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DotGridOverlay({ active }: { active: boolean }) {
  const cols = 14;
  const rows = 14;
  const cells = Array.from({ length: cols * rows });
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            padding: 8,
          }}
        >
          {cells.map((_, i) => {
            const delay = ((i * 37) % (cols * rows)) / (cols * rows);
            return (
              <div key={i} className="flex items-center justify-center">
                <motion.div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: "white",
                  }}
                  animate={{ opacity: [0.15, 0.9, 0.15] }}
                  transition={{
                    duration: 1.6,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: delay * 1.6,
                  }}
                />
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
    >
      <circle
        cx="6"
        cy="6"
        r="4.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <path
        d="M6 1.5 A4.5 4.5 0 0 1 10.5 6"
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
