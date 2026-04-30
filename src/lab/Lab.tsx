import { useParams, Link } from "react-router-dom";
import { registry } from "../prototypes/registry";

export function Lab() {
  const { slug } = useParams<{ slug: string }>();
  const entry = slug ? registry[slug] : undefined;

  if (!entry) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted text-sm">Prototype not found.</p>
      </div>
    );
  }

  const { component: Prototype, meta } = entry;

  return (
    <div className="h-full relative">
      {/* Header overlays the canvas so the prototype's background (incl. tint) extends to the top */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-end gap-2 px-6 h-12 text-sm pointer-events-none">
        <Link
          to="/"
          className="text-white/60 hover:text-white transition-colors pointer-events-auto"
        >
          Prototypes
        </Link>
        <span className="text-white/60">/</span>
        <span className="text-white">{meta.title}</span>
      </header>

      {/* Canvas — fills full height; prototype owns layout */}
      <main className="h-full" style={{ backgroundColor: "#838383" }}>
        <Prototype />
      </main>
    </div>
  );
}
