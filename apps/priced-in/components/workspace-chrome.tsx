"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAnalysis } from "./analysis-provider";
import { toCashFlowCsv, toMarkdown, toProvenanceCsv } from "@/domain/export/reports";
import { SCALES, type Scale } from "@/domain/intake/metrics";
import { downloadText, slugify } from "@/lib/download";

const ROUTES = [
  { href: "/workspace/import", label: "1. Import" },
  { href: "/workspace/review", label: "2. Review" },
  { href: "/workspace/expectations", label: "3. Expectations" },
  { href: "/workspace/operations", label: "4. Operations" },
  { href: "/workspace/ai", label: "5. AI initiative" },
  { href: "/workspace/challenge", label: "6. Break my thesis" },
  { href: "/workspace/brief", label: "7. Brief" },
];

export function WorkspaceChrome() {
  const { document: analysis, computation, update, resetToSample, forgetEverything, exportJson } = useAnalysis();
  const pathname = usePathname();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const scale = computation.assumptions.displayScale;
  const slug = slugify(analysis.company.name);

  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <div>
            <Link href="/" className="wordmark">
              Priced <span>In</span>
            </Link>
            <div className="masthead-meta" style={{ marginTop: "0.25rem" }}>
              <strong style={{ color: "var(--ink)" }}>{analysis.company.name}</strong>
              {analysis.company.fictional ? <span className="badge badge-assumed">Fictional company</span> : null}
              <span>As of {computation.assumptions.asOfDate}</span>
              <span>Engine {analysis.engineVersion}</span>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">Scenario</span>
              <select
                value={analysis.activeScenarioId}
                onChange={(event) => update((current) => ({ ...current, activeScenarioId: event.target.value }))}
              >
                {analysis.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">Display scale</span>
              <select
                value={scale}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    scenarios: current.scenarios.map((scenario) => ({
                      ...scenario,
                      assumptions: { ...scenario.assumptions, displayScale: event.target.value as Scale },
                    })),
                  }))
                }
              >
                {SCALES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="masthead-inner" style={{ paddingTop: 0 }}>
          <div className="row">
            <button type="button" onClick={() => downloadText(`${slug}-analysis.json`, "application/json", exportJson())}>
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => downloadText(`${slug}-brief.md`, "text/markdown", toMarkdown(analysis, computation))}
            >
              Export Markdown
            </button>
            <button
              type="button"
              onClick={() => downloadText(`${slug}-cash-flows.csv`, "text/csv", toCashFlowCsv(analysis, computation))}
            >
              Export CSV
            </button>
            <button type="button" onClick={() => downloadText(`${slug}-sources.csv`, "text/csv", toProvenanceCsv(analysis))}>
              Export sources
            </button>
          </div>
          <div className="row">
            <span className="footnote">Saved in this browser only</span>
            <button type="button" onClick={resetToSample}>
              Reset to sample
            </button>
            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => {
                    void forgetEverything();
                    setConfirmingDelete(false);
                  }}
                >
                  Delete everything
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)}>
                Delete local data
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="workspace-nav" aria-label="Analysis steps">
        <ol>
          {ROUTES.map((route) => (
            <li key={route.href}>
              <Link href={route.href} aria-current={pathname === route.href ? "page" : undefined}>
                {route.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
