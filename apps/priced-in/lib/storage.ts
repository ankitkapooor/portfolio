import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "priced-in";
const STORE = "analyses";
const CURRENT_KEY = "current";
const DB_VERSION = 1;

function available(): boolean {
  return typeof indexedDB !== "undefined";
}

async function db(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    },
  });
}

/** Analyses stay on this device. Nothing is sent to a server. */
export async function loadStoredAnalysis(): Promise<unknown | undefined> {
  if (!available()) return undefined;
  return (await db()).get(STORE, CURRENT_KEY);
}

export async function saveStoredAnalysis(value: unknown): Promise<void> {
  if (!available()) return;
  await (await db()).put(STORE, value, CURRENT_KEY);
}

export async function deleteAllStoredAnalyses(): Promise<void> {
  if (!available()) return;
  await (await db()).clear(STORE);
}
