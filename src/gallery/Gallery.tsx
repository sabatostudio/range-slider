import { Link } from "react-router-dom";
import { registry } from "../prototypes/registry";

export function Gallery() {
  const entries = Object.entries(registry);

  return (
    <div className="min-h-full px-6 py-12">
      <h1 className="text-2xl font-medium tracking-tight text-ink mb-8">
        Prototypes
      </h1>

      {entries.length === 0 ? (
        <p className="text-muted text-sm">No prototypes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([slug, { meta }]) => (
            <Link
              key={slug}
              to={`/p/${slug}`}
              className="block rounded-xl bg-surface p-5 hover:ring-1 hover:ring-muted/30 transition-all"
            >
              <p className="text-sm font-medium text-ink">{meta.title}</p>
              {meta.tags && (
                <p className="text-xs text-muted mt-1">
                  {meta.tags.join(" · ")}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
