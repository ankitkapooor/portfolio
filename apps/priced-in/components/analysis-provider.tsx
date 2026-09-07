"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { computeAnalysis, type AnalysisComputation } from "@/domain/analysis/compute";
import { parseAnalysis, serializeAnalysis, withUpdatedAssumptions } from "@/domain/analysis/document";
import { createSampleDocument } from "@/domain/analysis/sample";
import { analysisDocumentSchema, type AnalysisDocument, type AssumptionSet } from "@/domain/analysis/schema";
import { deleteAllStoredAnalyses, loadStoredAnalysis, saveStoredAnalysis } from "@/lib/storage";

interface AnalysisContextValue {
  document: AnalysisDocument;
  computation: AnalysisComputation;
  /** False until IndexedDB has been read, so we never flash a stale analysis. */
  hydrated: boolean;
  /** Set when an input has changed and a worker-backed result has not caught up yet. */
  lastEditAt: number;
  update: (change: (document: AnalysisDocument) => AnalysisDocument) => void;
  updateAssumptions: (change: (assumptions: AssumptionSet) => AssumptionSet) => void;
  replaceDocument: (document: AnalysisDocument) => void;
  resetToSample: () => void;
  forgetEverything: () => Promise<void>;
  exportJson: () => string;
  importJson: (text: string) => { ok: true } | { ok: false; issues: string[] };
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [document, setDocument] = useState<AnalysisDocument>(() => createSampleDocument());
  const [hydrated, setHydrated] = useState(false);
  const [lastEditAt, setLastEditAt] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStoredAnalysis()
      .then((stored) => {
        if (cancelled || stored === undefined) return;
        const parsed = analysisDocumentSchema.safeParse(stored);
        if (parsed.success) setDocument(parsed.data);
      })
      .catch(() => {
        // A failed read leaves the sample in place; nothing is silently merged.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveStoredAnalysis(document);
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [document, hydrated]);

  const update = useCallback((change: (document: AnalysisDocument) => AnalysisDocument) => {
    setDocument((current) => ({ ...change(current), updatedAt: new Date().toISOString() }));
    setLastEditAt(Date.now());
  }, []);

  const updateAssumptions = useCallback(
    (change: (assumptions: AssumptionSet) => AssumptionSet) => {
      update((current) => withUpdatedAssumptions(current, change));
    },
    [update],
  );

  const replaceDocument = useCallback((next: AnalysisDocument) => {
    setDocument(next);
    setLastEditAt(Date.now());
  }, []);

  const resetToSample = useCallback(() => {
    replaceDocument(createSampleDocument());
  }, [replaceDocument]);

  const forgetEverything = useCallback(async () => {
    await deleteAllStoredAnalyses();
    replaceDocument(createSampleDocument());
  }, [replaceDocument]);

  const exportJson = useCallback(() => serializeAnalysis(document), [document]);

  const importJson = useCallback(
    (text: string) => {
      const parsed = parseAnalysis(text);
      if (!parsed.ok) return { ok: false as const, issues: parsed.issues };
      replaceDocument(parsed.document);
      return { ok: true as const };
    },
    [replaceDocument],
  );

  const computation = useMemo(() => computeAnalysis(document), [document]);

  const value = useMemo<AnalysisContextValue>(
    () => ({
      document,
      computation,
      hydrated,
      lastEditAt,
      update,
      updateAssumptions,
      replaceDocument,
      resetToSample,
      forgetEverything,
      exportJson,
      importJson,
    }),
    [
      document,
      computation,
      hydrated,
      lastEditAt,
      update,
      updateAssumptions,
      replaceDocument,
      resetToSample,
      forgetEverything,
      exportJson,
      importJson,
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error("useAnalysis must be used inside an AnalysisProvider");
  return context;
}
