import { createHash } from "node:crypto";

/** Minimal flag parser. `--name value` and `--name=value` and boolean `--name`. */
export function parseFlags(argv: readonly string[]): Record<string, string | true> {
  const flags: Record<string, string | true> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const body = token.slice(2);
    const equals = body.indexOf("=");
    if (equals !== -1) {
      flags[body.slice(0, equals)] = body.slice(equals + 1);
      continue;
    }
    const name = body;
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[name] = next;
      index += 1;
    } else {
      flags[name] = true;
    }
  }
  return flags;
}

export function requireString(
  flags: Record<string, string | true>,
  name: string,
): string {
  const value = flags[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new CliError(`Missing required flag --${name}`);
  }
  return value;
}

export function optionalNumber(
  flags: Record<string, string | true>,
  name: string,
): number | null {
  const value = flags[name];
  if (value === undefined) return null;
  if (value === true) throw new CliError(`--${name} needs a value`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new CliError(`--${name} must be a number`);
  return parsed;
}

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode = 1,
  ) {
    super(message);
    this.name = "CliError";
  }
}

/** Deterministic JSON with recursively sorted keys, so hashes are stable. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    );
    return Object.fromEntries(entries.map(([key, item]) => [key, sortKeys(item)]));
  }
  return value;
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hashOf(value: unknown): string {
  return sha256(canonicalJson(value));
}

export const OK = "  ok  ";
export const FAIL = " FAIL ";

export function runCli(main: () => Promise<void> | void): void {
  Promise.resolve()
    .then(main)
    .catch((error: unknown) => {
      if (error instanceof CliError) {
        process.stderr.write(`\nError: ${error.message}\n`);
        process.exit(error.exitCode);
      }
      throw error;
    });
}
