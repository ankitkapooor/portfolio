"use client";

import { useEffect, useRef, useState } from "react";
import { computeGrid, type GridRequest, type GridResult } from "@/domain/finance/grid";
import type { GridWorkerResponse } from "@/workers/grid.worker";

export type GridStatus = "running" | "ready" | "error";

export interface GridState {
  /** The previous valid result stays on screen while a new run is pending. */
  result: GridResult | null;
  /** The request key the visible result belongs to. */
  resultKey: string | null;
  status: GridStatus;
  stale: boolean;
  error: string | null;
  /** True when the browser could not start a worker and the grid ran on the main thread. */
  ranOnMainThread: boolean;
}

/**
 * Runs the 41x41 grid in a Web Worker. An edit marks the visible grid stale
 * until the new run lands; the previous result is never mixed with new inputs.
 */
export function useExpectationsGrid(request: GridRequest, cacheKey: string): GridState {
  const [state, setState] = useState<GridState>({
    result: null,
    resultKey: null,
    status: "running",
    stale: false,
    error: null,
    ranOnMainThread: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const latestRequest = useRef(request);
  latestRequest.current = request;

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    let worker: Worker;
    try {
      worker = new Worker(new URL("../workers/grid.worker.ts", import.meta.url), { type: "module" });
    } catch {
      return;
    }
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const id = requestIdRef.current + 1;
    requestIdRef.current = id;
    setState((current) => ({ ...current, status: "running", stale: current.result !== null, error: null }));

    const worker = workerRef.current;
    if (!worker) {
      // No worker available: compute inline so the surface still works, and say so.
      try {
        const result = computeGrid(latestRequest.current);
        setState({ result, resultKey: cacheKey, status: "ready", stale: false, error: null, ranOnMainThread: true });
      } catch (error) {
        setState((current) => ({ ...current, status: "error", error: (error as Error).message }));
      }
      return;
    }

    const onMessage = (event: MessageEvent<GridWorkerResponse>) => {
      if (event.data.id !== id) return;
      setState({
        result: event.data.result,
        resultKey: cacheKey,
        status: "ready",
        stale: false,
        error: null,
        ranOnMainThread: false,
      });
    };
    const onError = (event: ErrorEvent) => {
      setState((current) => ({ ...current, status: "error", error: event.message }));
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ id, request: latestRequest.current });

    return () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    // The cache key covers every input the grid actually depends on.
  }, [cacheKey]);

  return state;
}

/** Only the inputs the grid depends on. Growth and target margin are the axes. */
export function gridCacheKey(request: GridRequest): string {
  return JSON.stringify({
    baseline: request.baseline,
    years: request.forecast.years,
    startingMargin: request.forecast.startingMargin,
    taxRate: request.forecast.taxRate,
    daRatios: request.forecast.daRatios,
    capexRatios: request.forecast.capexRatios,
    nwcRatios: request.forecast.nwcRatios,
    terminal: request.terminal,
    targetEvUsd: request.targetEvUsd,
    growthMin: request.growthMin,
    growthMax: request.growthMax,
    marginMin: request.marginMin,
    marginMax: request.marginMax,
    steps: request.steps,
  });
}
