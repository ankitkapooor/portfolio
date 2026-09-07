import { openDB, deleteDB, type IDBPDatabase } from "idb";
import {
  ComparisonSessionSchema,
  type ComparisonSession,
} from "@/domain/schemas/comparison";

/**
 * Local, private storage for comparison results (BRD section 8).
 *
 * Everything a visitor does in the lab stays in their browser. Nothing is sent
 * anywhere, there is no analytics call, and "Delete local data" drops the database
 * rather than clearing a flag.
 */

export const DB_NAME = "the-moat-test";
const DB_VERSION = 1;
const META_STORE = "meta";
const COMPARISON_STORE = "comparisons";
const SEED_KEY = "sessionSeed";

function open(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
      if (!db.objectStoreNames.contains(COMPARISON_STORE)) {
        db.createObjectStore(COMPARISON_STORE, { keyPath: "id" });
      }
    },
  });
}

function randomSeed(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The seed that fixes panel order. Created once and reused, so the blind state
 * survives a reload; that is the whole reason it is persisted rather than held in
 * component state.
 */
export async function getSessionSeed(): Promise<string> {
  const db = await open();
  const existing = (await db.get(META_STORE, SEED_KEY)) as string | undefined;
  if (typeof existing === "string" && existing.length > 0) {
    db.close();
    return existing;
  }
  const seed = randomSeed();
  await db.put(META_STORE, seed, SEED_KEY);
  db.close();
  return seed;
}

export async function saveComparison(session: ComparisonSession): Promise<void> {
  const validated = ComparisonSessionSchema.parse(session);
  const db = await open();
  await db.put(COMPARISON_STORE, validated);
  db.close();
}

export async function getComparison(
  id: string,
): Promise<ComparisonSession | null> {
  const db = await open();
  const found = await db.get(COMPARISON_STORE, id);
  db.close();
  if (!found) return null;
  const parsed = ComparisonSessionSchema.safeParse(found);
  return parsed.success ? parsed.data : null;
}

export async function listComparisons(): Promise<ComparisonSession[]> {
  const db = await open();
  const all = await db.getAll(COMPARISON_STORE);
  db.close();
  return all
    .map((item) => ComparisonSessionSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

/** Drops the database outright. There is nothing left to recover afterwards. */
export async function deleteLocalData(): Promise<void> {
  await deleteDB(DB_NAME);
}
