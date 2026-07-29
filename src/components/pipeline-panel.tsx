import { ExternalLink, Radio, RefreshCw } from "lucide-react";
import pipelineStatus from "@/data/pipeline-status.json";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/section-header";

type MarketStatus = {
  id: string;
  name: string;
  live: boolean;
  as_of?: string;
  generated_at?: string;
  buildings?: number;
  available?: number;
  method?: string;
  source?: string;
  upstream?: string;
  scraper_repo?: string;
  last_sync_at?: string;
  warnings?: string[];
  errors?: string[];
};

const markets = Object.values(
  (pipelineStatus as { markets?: Record<string, MarketStatus> }).markets || {},
);

export function PipelinePanel() {
  const updated = (pipelineStatus as { updated_at?: string }).updated_at;

  return (
    <section className="panel p-4 sm:p-6">
      <SectionHeader
        title="Automated rent data"
        description="Journal Square syncs daily from your live scraper. Other markets use the multi-market registry when enabled."
        className="mb-4"
        action={
          <Badge variant="live" className="gap-1">
            <Radio className="h-3 w-3" />
            Pipeline
          </Badge>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <RefreshCw className="h-3.5 w-3.5" />
        Last status write:{" "}
        <span className="font-mono text-fg">
          {updated
            ? new Date(updated).toLocaleString("en-US", {
                timeZone: "America/New_York",
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </span>
        <span className="text-fg-subtle">· ET</span>
      </div>

      <div className="space-y-3">
        {markets.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No pipeline runs yet. Locally:{" "}
            <code className="rounded bg-bg-muted px-1.5 py-0.5 text-xs">
              npm run scrape:sync
            </code>
          </p>
        ) : (
          markets.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-border bg-bg-muted/40 px-3 py-3 sm:px-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{m.name}</p>
                    {m.live ? (
                      <Badge variant="live">Live</Badge>
                    ) : (
                      <Badge variant="demo">Demo</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    as of <span className="font-mono text-fg">{m.as_of}</span>
                    {m.buildings != null ? (
                      <>
                        {" "}
                        · {m.buildings} buildings · {m.available ?? 0} available
                      </>
                    ) : null}
                    {m.method ? (
                      <>
                        {" "}
                        · <span className="font-mono">{m.method}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                {m.scraper_repo || m.upstream ? (
                  <div className="flex flex-wrap gap-2">
                    {m.upstream ? (
                      <a
                        href={m.upstream}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        Feed <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {m.scraper_repo ? (
                      <a
                        href={m.scraper_repo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        Scraper repo <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {m.warnings?.length ? (
                <ul className="mt-2 space-y-0.5 text-xs text-warning">
                  {m.warnings.slice(0, 3).map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              ) : null}
              {m.errors?.length ? (
                <ul className="mt-2 space-y-0.5 text-xs text-negative">
                  {m.errors.slice(0, 3).map((e) => (
                    <li key={e}>✕ {e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-fg-muted">
        <p className="font-medium text-fg">How automation works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            <strong className="text-fg">~7:43am ET</strong> —{" "}
            <code className="text-[11px]">journal-square-monitor</code> scrapes
            every building's availability page (Playwright).
          </li>
          <li>
            <strong className="text-fg">~9:15am ET</strong> — this repo syncs
            that feed, runs any enabled multi-market scrapers, commits data,
            redeploys the public site.
          </li>
          <li>
            To add a scrape target: edit{" "}
            <code className="text-[11px]">scripts/scrape/registry.json</code>{" "}
            (see{" "}
            <code className="text-[11px]">scripts/scrape/README.md</code>).
          </li>
        </ol>
      </div>
    </section>
  );
}
