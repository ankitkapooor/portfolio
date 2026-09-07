export interface EngineIssue {
  code: string;
  message: string;
  field?: string;
}

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; issues: EngineIssue[] };

export function ok<T>(value: T): Outcome<T> {
  return { ok: true, value };
}

export function fail<T>(issues: EngineIssue[]): Outcome<T> {
  return { ok: false, issues };
}

/**
 * Thrown for malformed engine input (wrong array lengths, non-finite numbers).
 * Business-rule rejections (WACC <= g, negative equity, ...) return an Outcome
 * instead, because the UI has to render them.
 */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

export function assertFinite(value: number, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EngineError(`${field} must be a finite number, received ${String(value)}`);
  }
}
