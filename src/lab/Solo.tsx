import { useParams } from "react-router-dom";
import { registry } from "../prototypes/registry";

export function Solo() {
  const { slug } = useParams<{ slug: string }>();
  const entry = slug ? registry[slug] : undefined;

  if (!entry) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted text-sm">Prototype not found.</p>
      </div>
    );
  }

  const { component: Prototype } = entry;

  return (
    <div className="h-full relative">
      <header className="absolute top-5 left-6 z-40 flex flex-col text-sm pointer-events-none leading-tight">
        <span className="text-white">Prototype</span>
        <span className="text-white">↳ Range Slider</span>
      </header>
      <main className="h-full" style={{ backgroundColor: "#838383" }}>
        <Prototype />
      </main>
    </div>
  );
}
