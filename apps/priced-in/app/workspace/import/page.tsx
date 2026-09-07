"use client";

import { useRef, useState } from "react";
import { useAnalysis } from "@/components/analysis-provider";
import { createDocumentFromImport } from "@/domain/analysis/document";
import { createSampleDocument, sampleCompanyCsv, SAMPLE_COMPANY_NAME, SAMPLE_DISCLAIMER } from "@/domain/analysis/sample";
import { parseCsv } from "@/domain/intake/csv";
import { normalizeRows, type IntakeIssue, type NormalizationResult } from "@/domain/intake/facts";
import { blankTemplateCsv } from "@/domain/intake/template";
import { downloadText } from "@/lib/download";

const MAX_BYTES = 10 * 1024 * 1024;

function IssueList({ issues }: { issues: IntakeIssue[] }) {
  if (issues.length === 0) return null;
  const blocking = issues.filter((issue) => issue.severity === "blocking");
  const warnings = issues.filter((issue) => issue.severity !== "blocking");
  return (
    <>
      {blocking.length > 0 ? (
        <div className="callout callout-alert">
          <p>
            <strong>{blocking.length} blocking problem{blocking.length === 1 ? "" : "s"}.</strong> These rows were not
            imported. Nothing was guessed or defaulted.
          </p>
          <ul className="tight" style={{ marginBottom: 0 }}>
            {blocking.slice(0, 30).map((issue, index) => (
              <li key={index}>
                {issue.rowNumber ? `Row ${issue.rowNumber}: ` : ""}
                {issue.message}
              </li>
            ))}
            {blocking.length > 30 ? <li>…and {blocking.length - 30} more.</li> : null}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
          <ul className="tight" style={{ marginBottom: 0 }}>
            {warnings.slice(0, 20).map((issue, index) => (
              <li key={index}>
                {issue.rowNumber ? `Row ${issue.rowNumber}: ` : ""}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

export default function ImportPage() {
  const { replaceDocument, importJson, resetToSample } = useAnalysis();
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [baselineYear, setBaselineYear] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [jsonIssues, setJsonIssues] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelled = useRef(false);

  const today = new Date().toISOString().slice(0, 10);

  async function handleCsv(file: File) {
    setJsonIssues(null);
    if (file.size > MAX_BYTES) {
      setStatus(`That file is ${(file.size / 1_048_576).toFixed(1)} MB. The limit is 10 MB.`);
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setStatus("Only .csv files matching the template are accepted here. Executable and archive formats are rejected.");
      return;
    }
    cancelled.current = false;
    setBusy(true);
    setStatus(`Reading ${file.name}…`);
    try {
      const text = await file.text();
      if (cancelled.current) {
        setStatus("Import cancelled. Nothing was changed.");
        return;
      }
      setStatus("Normalizing rows…");
      const normalized = normalizeRows(parseCsv(text), { today, expectedCurrency: "USD" });
      if (cancelled.current) {
        setStatus("Import cancelled. Nothing was changed.");
        return;
      }
      setResult(normalized);
      const years = [...new Set(normalized.facts.map((fact) => fact.fiscalYear))].sort((a, b) => b - a);
      setBaselineYear(years[0] ?? null);
      setCompanyName(normalized.facts[0]?.company ?? "");
      setStatus(
        `${normalized.facts.length} facts read from ${file.name}. Nothing has been applied to the model yet.`,
      );
    } catch (error) {
      setStatus(`Could not read that file: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleJson(file: File) {
    setResult(null);
    setStatus(null);
    const text = await file.text();
    const outcome = importJson(text);
    if (outcome.ok) {
      setJsonIssues(null);
      setStatus(`Loaded ${file.name}. Inputs and source records were restored from the file.`);
    } else {
      setJsonIssues(outcome.issues);
    }
  }

  const blocking = result?.issues.filter((issue) => issue.severity === "blocking").length ?? 0;
  const canApply = result !== null && result.facts.length > 0 && baselineYear !== null && companyName.trim() !== "";

  return (
    <div className="workspace-body">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step one</p>
          <h1>Bring in the numbers</h1>
          <p className="lede">
            Three intake paths were specified for this product. One of them works today; the other two are honest about
            being unbuilt.
          </p>
        </section>

        <section className="card">
          <h2>Explore the sample company</h2>
          <p className="badge badge-assumed">Fictional</p>
          <p className="note">{SAMPLE_DISCLAIMER}</p>
          <div className="row">
            <button type="button" className="button-primary" onClick={resetToSample}>
              Load {SAMPLE_COMPANY_NAME}
            </button>
            <button
              type="button"
              onClick={() => downloadText("meridian-harbor-sample.csv", "text/csv", sampleCompanyCsv())}
            >
              Download the sample as CSV
            </button>
          </div>
          <p className="footnote">
            Loading the sample replaces whatever is currently in the workspace. Export first if you want to keep it.
          </p>
        </section>

        <section className="card">
          <h2>CSV template import</h2>
          <p className="note">
            The template is long form: one row per company, fiscal year, statement, metric and value, with its unit,
            scale and source locator beside it. Balance-sheet items need a period end; flow items need both a start and
            an end.
          </p>
          <div className="row">
            <button
              type="button"
              onClick={() =>
                downloadText(
                  "priced-in-template.csv",
                  "text/csv",
                  blankTemplateCsv(new Date().getUTCFullYear() - 1, `${new Date().getUTCFullYear() - 1}-01-01`, `${new Date().getUTCFullYear() - 1}-12-31`),
                )
              }
            >
              Download the blank template
            </button>
            <label className="button">
              Choose a CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="visually-hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleCsv(file);
                  event.target.value = "";
                }}
              />
            </label>
            {busy ? (
              <button type="button" onClick={() => (cancelled.current = true)}>
                Cancel
              </button>
            ) : null}
          </div>
          {status ? (
            <p className="note" aria-live="polite">
              {status}
            </p>
          ) : null}

          {result ? (
            <>
              <hr className="divider" />
              <IssueList issues={result.issues} />
              <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                <div className="field">
                  <label htmlFor="company-name">Company name</label>
                  <input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="baseline-year">Baseline fiscal year</label>
                  <select
                    id="baseline-year"
                    value={baselineYear ?? ""}
                    onChange={(event) => setBaselineYear(Number(event.target.value))}
                  >
                    {[...new Set(result.facts.map((fact) => fact.fiscalYear))]
                      .sort((a, b) => b - a)
                      .map((year) => (
                        <option key={year} value={year}>
                          FY{year}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <p className="note">
                {result.facts.length} facts ready, {result.superseded.length} superseded by a later filing,{" "}
                {blocking} rows rejected. Ratios will default to the reviewed baseline year and are marked as derived,
                not accepted silently.
              </p>
              <button
                type="button"
                className="button-primary"
                disabled={!canApply}
                onClick={() => {
                  if (!result || baselineYear === null) return;
                  replaceDocument(
                    createDocumentFromImport({
                      companyName: companyName.trim(),
                      facts: result.facts,
                      superseded: result.superseded,
                      baselineFiscalYear: baselineYear,
                      now: new Date().toISOString(),
                    }),
                  );
                  setStatus("Applied. Go to Review to check every value against its source before valuing anything.");
                  setResult(null);
                }}
              >
                Apply to the workspace
              </button>
            </>
          ) : null}
        </section>

        <section className="card">
          <h2>Reopen a saved analysis</h2>
          <p className="note">
            A JSON export contains every input, every source record and the engine version that produced the outputs.
            Reimporting reproduces both.
          </p>
          <label className="button">
            Choose a JSON file
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleJson(file);
                event.target.value = "";
              }}
            />
          </label>
          {jsonIssues ? (
            <div className="callout callout-alert" style={{ marginTop: "0.75rem" }}>
              <p>
                <strong>That file could not be read as an analysis.</strong> The workspace was left untouched.
              </p>
              <ul className="tight" style={{ marginBottom: 0 }}>
                {jsonIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Not implemented in this release</h2>
          <div className="grid-2">
            <div>
              <h3>SEC company retrieval</h3>
              <p className="badge badge-alert">P0B, not built</p>
              <p className="note">
                Server-side retrieval of SEC submissions and company facts by CIK or ticker is specified for the next
                release. There is no endpoint behind this app today, so no ticker box is offered. A disabled search box
                that silently did nothing would be worse than saying this.
              </p>
            </div>
            <div>
              <h3>PDF statement extraction</h3>
              <p className="badge badge-alert">P0B, not built</p>
              <p className="note">
                Native-text PDF extraction with mandatory human review is also P0B. Scanned documents would get an
                explicit &ldquo;OCR not supported&rdquo; state rather than invented numbers. Until that path exists,
                mapping a PDF into the CSV template by hand is the supported route.
              </p>
            </div>
          </div>
          <p className="footnote">
            No language model is involved anywhere in this application, and no API credential is required for any part
            of the financial model.
          </p>
        </section>

        <section className="card">
          <h2>Where your data lives</h2>
          <p className="note">
            Files are parsed in this browser tab. The analysis is stored in this browser&rsquo;s IndexedDB so it survives
            a refresh, and the <em>Delete local data</em> control at the top removes it. Nothing is uploaded, logged or
            shared, and there is no public link feature in this release.
          </p>
          <p className="footnote">
            Intake limits: 10 MB per file, CSV only in this release, and the file is validated before any row is
            accepted.
          </p>
        </section>
      </div>

      <aside className="rail">
        <div className="rail-inner">
          <p className="eyebrow">Reset</p>
          <p className="note">
            Start again from the fictional sample at any time. This does not touch anything outside this browser.
          </p>
          <button type="button" onClick={() => replaceDocument(createSampleDocument())}>
            Reset to the sample
          </button>
        </div>
      </aside>
    </div>
  );
}
