"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionId, EnvironmentId, GameRun, Role } from "@/domain/schema";
import { commitRound, createRun, rewindTo, switchSides } from "@/domain/run";
import { importRun } from "@/domain/portability";
import { defaultScenario } from "@/content/scenarios";
import {
  clearEverything,
  getActiveRunId,
  listRuns,
  loadRun,
  saveRun,
  setActiveRunId,
} from "@/persistence/runStore";

export type SessionStatus = "loading" | "ready";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Loads, mutates and saves the active run.
 *
 * If local storage is unavailable the session still works in memory and says so
 * rather than pretending the run is saved.
 */
export function useRunSession() {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [run, setRun] = useState<GameRun | null>(null);
  const [runs, setRuns] = useState<GameRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const all = await listRuns();
      if (mounted.current) setRuns(all);
    } catch {
      // A missing run list is not fatal; the storage warning already covers it.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeId = await getActiveRunId();
        const active = activeId ? await loadRun(activeId) : null;
        if (cancelled) return;
        setRun(active);
        await refreshList();
      } catch (cause) {
        if (cancelled) return;
        setStorageError(message(cause));
      } finally {
        if (!cancelled) setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshList]);

  const persist = useCallback(
    async (next: GameRun) => {
      setRun(next);
      setSaveStatus("saving");
      try {
        await saveRun(next);
        await setActiveRunId(next.id);
        if (mounted.current) setSaveStatus("saved");
        await refreshList();
      } catch (cause) {
        if (!mounted.current) return;
        setSaveStatus("error");
        setStorageError(message(cause));
      }
    },
    [refreshList],
  );

  const start = useCallback(
    async (role: Role, environmentId: EnvironmentId) => {
      setError(null);
      try {
        const created = createRun({
          id: newId(),
          createdAt: new Date().toISOString(),
          role,
          environmentId,
          scenarioId: defaultScenario.id,
          label: `${role === "incumbent" ? "RelayWorks" : "TaskPilot"} - ${environmentId}`,
        });
        await persist(created);
      } catch (cause) {
        setError(message(cause));
      }
    },
    [persist],
  );

  const commit = useCallback(
    async (actionId: ActionId, rationale: string) => {
      if (!run) return;
      setError(null);
      try {
        await persist(commitRound(run, actionId, rationale));
      } catch (cause) {
        setError(message(cause));
      }
    },
    [persist, run],
  );

  const branch = useCallback(
    async (quarter: number): Promise<string | null> => {
      if (!run) return null;
      setError(null);
      try {
        const branched = rewindTo(run, quarter, newId(), new Date().toISOString());
        await persist(branched);
        return branched.id;
      } catch (cause) {
        setError(message(cause));
        return null;
      }
    },
    [persist, run],
  );

  const reverse = useCallback(async (): Promise<string | null> => {
    if (!run) return null;
    setError(null);
    try {
      const reversed = switchSides(run, newId(), new Date().toISOString());
      await persist(reversed);
      return reversed.id;
    } catch (cause) {
      setError(message(cause));
      return null;
    }
  }, [persist, run]);

  const openRun = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const found = await loadRun(id);
        if (!found) {
          setError(`Run "${id}" is no longer in local storage.`);
          return;
        }
        setRun(found);
        await setActiveRunId(id);
      } catch (cause) {
        setError(message(cause));
      }
    },
    [],
  );

  const reset = useCallback(async () => {
    setError(null);
    try {
      await clearEverything();
    } catch (cause) {
      setStorageError(message(cause));
    }
    setRun(null);
    setRuns([]);
    setSaveStatus("idle");
  }, []);

  const importFromText = useCallback(
    async (text: string): Promise<string[]> => {
      setError(null);
      const { run: imported, notes } = importRun(text);
      await persist(imported);
      return notes;
    },
    [persist],
  );

  return {
    status,
    run,
    runs,
    error,
    storageError,
    saveStatus,
    setError,
    start,
    commit,
    branch,
    reverse,
    openRun,
    reset,
    importFromText,
  };
}
