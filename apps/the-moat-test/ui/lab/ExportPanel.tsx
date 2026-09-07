"use client";

import { useState } from "react";
import { toJson, toMarkdown, type ExportPayload } from "@/lib/export";

/**
 * Export (BRD section 8). The download carries scope, sources, versions and
 * limitations, and a preview is shown so nobody has to open the file to find out
 * what it says about itself.
 */
export function ExportPanel({
  buildPayload,
  baseName,
}: {
  buildPayload: () => ExportPayload;
  baseName: string;
}) {
  const [preview, setPreview] = useState<{
    format: "markdown" | "json";
    text: string;
  } | null>(null);

  const download = (format: "markdown" | "json") => {
    const payload = buildPayload();
    const text = format === "markdown" ? toMarkdown(payload) : toJson(payload);
    setPreview({ format, text });

    const blob = new Blob([text], {
      type: format === "markdown" ? "text/markdown" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName}.${format === "markdown" ? "md" : "json"}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="exportPanel" aria-labelledby="export-heading">
      <h2 id="export-heading" className="pageSectionTitle">
        Export
      </h2>
      <p className="measure">
        The file records what was compared, which versions produced it, and what it
        cannot be used to claim. Those limitations are part of the export itself, so
        they travel with it.
      </p>
      <div className="inputActions">
        <button
          type="button"
          className="button"
          onClick={() => download("markdown")}
          data-testid="export-markdown"
        >
          Download Markdown
        </button>
        <button
          type="button"
          className="button buttonSecondary"
          onClick={() => download("json")}
          data-testid="export-json"
        >
          Download JSON
        </button>
      </div>

      {preview ? (
        <div className="exportPreview" data-testid="export-preview">
          <h3 className="panelHeading">
            {preview.format === "markdown" ? "Markdown" : "JSON"} preview
          </h3>
          <pre className="specBlock exportPreviewBody">{preview.text}</pre>
        </div>
      ) : null}
    </section>
  );
}
