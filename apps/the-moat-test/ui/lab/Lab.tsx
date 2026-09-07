"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { runTaggedTranscriptBaseline } from "@/domain/baseline/tagged-transcript-baseline";
import type { PublicSample } from "@/domain/schemas/corpus";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import {
  ComparisonSessionSchema,
  type ComparisonChoice,
  type ComparisonSession,
  type PanelSource,
} from "@/domain/schemas/comparison";
import { countWords } from "@/domain/transcript";
import { buildExport, type ExportPayload } from "@/lib/export";
import { assignPanels } from "@/lib/panel-assignment";
import { getComparison, getSessionSeed, saveComparison } from "@/lib/local-store";
import { DataModeBadge } from "@/ui/Badges";
import { OutputView } from "@/ui/OutputView";
import { TranscriptView, transcriptLineText } from "@/ui/TranscriptView";
import { Comparison, type PanelDescriptor } from "./Comparison";
import { ExportPanel } from "./ExportPanel";
import { LocalDataPanel } from "./LocalDataPanel";
import { TranscriptInput, type TranscriptSelection } from "./TranscriptInput";

/**
 * The lab (BRD section 3, illustrative-demo mode).
 *
 * The baseline runs here, in the browser, over whichever transcript is selected. It
 * is deterministic, so this is a real execution of the real method rather than a
 * recording of one. The other panel is a hand-authored illustrative output, and it
 * exists only for the six corpus samples — which is why a visitor's own transcript
 * gets the baseline alone and a sentence saying why.
 */

const COMPARED_SOURCES: readonly [PanelSource, PanelSource] = [
  "tagged-transcript-baseline",
  "illustrative-challenger",
];

export function Lab({
  samples,
  illustrativeOutputs,
  descriptors,
  corpusVersion,
  appVersion,
  providerReason,
}: {
  samples: PublicSample[];
  illustrativeOutputs: Record<string, ExtractionOutput>;
  descriptors: Record<PanelSource, PanelDescriptor>;
  corpusVersion: string;
  appVersion: string;
  /** Null when a provider is configured. In this build it never is. */
  providerReason: string | null;
}) {
  const [selection, setSelection] = useState<TranscriptSelection>({
    kind: "sample",
    sampleId: samples[0].id,
  });
  const [seed, setSeed] = useState<string | null>(null);
  const [session, setSession] = useState<ComparisonSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSessionSeed()
      .then((value) => {
        if (!cancelled) setSeed(value);
      })
      .catch(() => {
        // IndexedDB can be unavailable (private mode, disabled storage). The lab
        // still runs; only the persisted blind assignment is lost.
        if (!cancelled) setSeed(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sample =
    selection.kind === "sample"
      ? samples.find((item) => item.id === selection.sampleId)
      : undefined;

  const transcript =
    selection.kind === "sample" ? (sample?.transcript ?? "") : selection.text;

  const baseline = useMemo(
    () => (transcript ? runTaggedTranscriptBaseline(transcript) : null),
    [transcript],
  );
  const lineText = useMemo(
    () => (transcript ? transcriptLineText(transcript) : {}),
    [transcript],
  );

  const illustrative = sample ? illustrativeOutputs[sample.id] : undefined;

  /**
   * Only a session that belongs to the current sample and the current seed counts.
   * Deriving this instead of clearing state in an effect means a stale session can
   * never be shown for one render while the effect catches up.
   */
  const activeSession =
    session && sample && session.sampleId === sample.id && session.sessionSeed === seed
      ? session
      : null;

  const comparisonAvailable = Boolean(sample && illustrative && baseline && seed);

  // Load or create the blind assignment for this sample. The assignment is derived
  // from the stored seed, so a reload restores the same order rather than a new one.
  useEffect(() => {
    if (!sample || !seed) return;
    let cancelled = false;
    const id = `cmp-${sample.id}`;

    getComparison(id)
      .then((existing) => {
        if (cancelled) return;
        if (existing && existing.sessionSeed === seed) {
          setSession(existing);
          return;
        }
        const now = new Date().toISOString();
        const assignment = assignPanels(seed, sample.id, COMPARED_SOURCES);
        const created = ComparisonSessionSchema.parse({
          id,
          sampleId: sample.id,
          sessionSeed: seed,
          panelA: assignment.panelA,
          panelB: assignment.panelB,
          choice: null,
          reason: null,
          revealed: false,
          createdAt: now,
          updatedAt: now,
          appVersion,
        });
        setSession(created);
        void saveComparison(created);
      })
      .catch(() => {
        // Storage is unavailable. The lab still runs; the comparison surface stays
        // hidden rather than silently reshuffling the panels on every render.
      });

    return () => {
      cancelled = true;
    };
  }, [sample, seed, appVersion]);

  const update = useCallback((next: ComparisonSession) => {
    setSession(next);
    void saveComparison(next);
  }, []);

  const onChoose = useCallback(
    (choice: ComparisonChoice, reason: string) => {
      if (!activeSession || activeSession.revealed) return;
      update({
        ...activeSession,
        choice,
        reason: reason.trim().length > 0 ? reason.trim() : null,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeSession, update],
  );

  const onReveal = useCallback(() => {
    if (!activeSession || activeSession.choice === null) return;
    update({ ...activeSession, revealed: true, updatedAt: new Date().toISOString() });
  }, [activeSession, update]);

  const buildPayload = useCallback((): ExportPayload => {
    const outputs: ExportPayload["outputs"] = [];
    if (baseline) {
      outputs.push({
        panel: activeSession
          ? activeSession.panelA === "tagged-transcript-baseline"
            ? "A"
            : "B"
          : null,
        label: descriptors["tagged-transcript-baseline"].name,
        version: descriptors["tagged-transcript-baseline"].version,
        dataMode: descriptors["tagged-transcript-baseline"].dataMode,
        isNot: descriptors["tagged-transcript-baseline"].isNot,
        output: baseline.output,
      });
    }
    if (illustrative && activeSession) {
      outputs.push({
        panel: activeSession.panelA === "illustrative-challenger" ? "A" : "B",
        label: descriptors["illustrative-challenger"].name,
        version: descriptors["illustrative-challenger"].version,
        dataMode: descriptors["illustrative-challenger"].dataMode,
        isNot: descriptors["illustrative-challenger"].isNot,
        output: illustrative,
      });
    }

    return buildExport({
      generatedAt: new Date().toISOString(),
      appVersion,
      corpusVersion: sample ? corpusVersion : null,
      transcript: {
        origin: sample ? "corpus-sample" : "visitor-supplied",
        id: sample?.id ?? null,
        title: sample?.title ?? null,
        synthetic: Boolean(sample),
        wordCount: sample?.wordCount ?? countWords(transcript),
        lineCount: baseline?.totalLineCount ?? 0,
      },
      outputs,
      comparison: activeSession
        ? {
            choice: activeSession.choice,
            reason: activeSession.reason,
            revealed: activeSession.revealed,
          }
        : null,
    });
  }, [
    appVersion,
    baseline,
    corpusVersion,
    descriptors,
    illustrative,
    sample,
    activeSession,
    transcript,
  ]);

  return (
    <div className="lab">
      <TranscriptInput
        samples={samples}
        selection={selection}
        onSelectSample={(sampleId) => setSelection({ kind: "sample", sampleId })}
        onSubmitOwn={(text) => setSelection({ kind: "own", text })}
      />

      {providerReason ? (
        <p className="measure note noteLimitation" data-testid="provider-status">
          {providerReason}
        </p>
      ) : null}

      {transcript.length === 0 ? (
        <p className="outputEmpty">Choose a sample or paste a transcript to begin.</p>
      ) : (
        <>
          <section className="labTranscript" aria-labelledby="lab-transcript-heading">
            <h2 id="lab-transcript-heading" className="pageSectionTitle">
              {sample ? sample.title : "Your transcript"}
            </h2>
            <p className="measure">
              {baseline?.taggedLineCount ?? 0} of {baseline?.totalLineCount ?? 0}{" "}
              lines carry an <code>ACTION:</code> or <code>DECISION:</code> tag. Line
              ids are shown so any citation below can be checked against the source.
            </p>
            <div className="transcriptScroll">
              <TranscriptView
                transcript={transcript}
                labelledBy="lab-transcript-heading"
              />
            </div>
          </section>

          {comparisonAvailable && activeSession ? (
            <Comparison
              session={activeSession}
              outputs={{
                "tagged-transcript-baseline": baseline?.output,
                "illustrative-challenger": illustrative,
                "ai-structured-extraction": undefined,
              }}
              descriptors={descriptors}
              lineText={lineText}
              onChoose={onChoose}
              onReveal={onReveal}
            />
          ) : (
            <section className="singleOutput" aria-labelledby="single-output-heading">
              <div className="resultsHeader">
                <h2 id="single-output-heading" className="pageSectionTitle">
                  {descriptors["tagged-transcript-baseline"].name}
                </h2>
                <DataModeBadge
                  mode={descriptors["tagged-transcript-baseline"].dataMode}
                />
              </div>
              <p className="measure note noteLimitation">
                {sample
                  ? "The blind comparison needs both outputs and a stored session seed. One of them is not available yet."
                  : "There is no blind comparison for your own transcript: the second panel is a hand-authored output that exists only for the six corpus samples, and writing one on demand would require a model this deployment does not have."}
              </p>
              {baseline ? (
                <OutputView
                  output={baseline.output}
                  lineText={lineText}
                  idPrefix="single-output"
                />
              ) : null}
            </section>
          )}

          <ExportPanel
            buildPayload={buildPayload}
            baseName={`moat-test-${sample?.id ?? "own-transcript"}`}
          />
        </>
      )}

      <LocalDataPanel
        onCleared={() => {
          setSeed(null);
          setSession(null);
          getSessionSeed()
            .then(setSeed)
            .catch(() => setSeed(null));
        }}
      />
    </div>
  );
}
