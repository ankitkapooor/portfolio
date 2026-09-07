/**
 * Local run storage.
 *
 * IndexedDB holds saved runs so a refresh resumes the exact unlocked state.
 * Nothing secret is stored here: a run is scenario data, action ids, rationale
 * text and derived numbers.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { GameRunSchema, type GameRun } from "@/domain/schema";

const DB_NAME = "disrupt-this-business";
const DB_VERSION = 1;
const RUNS = "runs";
const META = "meta";
const ACTIVE_RUN_KEY = "activeRunId";

interface DisruptDB extends DBSchema {
  runs: { key: string; value: GameRun; indexes: { createdAt: string } };
  meta: { key: string; value: string | null };
}

export class PersistenceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PersistenceError";
  }
}

let dbPromise: Promise<IDBPDatabase<DisruptDB>> | null = null;

function database(): Promise<IDBPDatabase<DisruptDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new PersistenceError(
        "This browser has no IndexedDB available, so runs cannot be saved. Play still works, but a refresh will lose the session.",
      ),
    );
  }
  if (!dbPromise) {
    dbPromise = openDB<DisruptDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(RUNS)) {
          const store = db.createObjectStore(RUNS, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META);
        }
      },
    }).catch((cause) => {
      dbPromise = null;
      throw new PersistenceError(
        "Could not open local storage for saved runs. Private browsing or a full disk can cause this.",
        { cause },
      );
    });
  }
  return dbPromise;
}

/** Stored runs are validated on read so a corrupted record fails loudly. */
function validate(value: unknown, id: string): GameRun {
  const parsed = GameRunSchema.safeParse(value);
  if (!parsed.success) {
    throw new PersistenceError(
      `Saved run "${id}" no longer matches the run schema and cannot be loaded. Reset the session to clear it.`,
    );
  }
  return parsed.data;
}

export async function saveRun(run: GameRun): Promise<void> {
  const db = await database();
  await db.put(RUNS, run);
}

export async function loadRun(id: string): Promise<GameRun | null> {
  const db = await database();
  const value = await db.get(RUNS, id);
  return value ? validate(value, id) : null;
}

export async function listRuns(): Promise<GameRun[]> {
  const db = await database();
  const values = await db.getAll(RUNS);
  return values
    .map((value) => validate(value, String((value as GameRun).id)))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteRun(id: string): Promise<void> {
  const db = await database();
  await db.delete(RUNS, id);
}

export async function getActiveRunId(): Promise<string | null> {
  const db = await database();
  return (await db.get(META, ACTIVE_RUN_KEY)) ?? null;
}

export async function setActiveRunId(id: string | null): Promise<void> {
  const db = await database();
  await db.put(META, id, ACTIVE_RUN_KEY);
}

/** Explicit reset. Never called implicitly. */
export async function clearEverything(): Promise<void> {
  const db = await database();
  await db.clear(RUNS);
  await db.clear(META);
}
