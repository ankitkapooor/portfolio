import { describe, expect, it } from "vitest";
import type { TranscriptCase } from "@/domain/schemas/corpus";
import { evaluateCase, aggregateEvaluation } from "@/domain/evaluation";
import {
  PROVIDER_NOT_CONFIGURED_REASON,
  ProviderTimeoutError,
  getExtractionProvider,
  getProviderStatus,
  withTimeout,
} from "./index";

/**
 * Model timeout handling (BRD section 10, and the failure rules in section 12).
 *
 * A model that never answers has to surface as a reportable timeout and then as a
 * case with no output. It must not hang, and it must not be quietly dropped from
 * the denominator of the run it was part of.
 */

function neverResolves(): Promise<never> {
  return new Promise(() => {});
}

describe("bounding a provider call", () => {
  it("rejects with a ProviderTimeoutError when the work does not finish in time", async () => {
    await expect(
      withTimeout(neverResolves, 10, "ai-structured-extraction"),
    ).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it("names the call and the budget in the error, so a run log says what expired", async () => {
    const error = await withTimeout(neverResolves, 10, "case-004").catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ProviderTimeoutError);
    if (!(error instanceof ProviderTimeoutError)) return;
    expect(error.label).toBe("case-004");
    expect(error.ms).toBe(10);
    expect(error.message).toMatch(/did not complete within 10 ms/);
  });

  it("aborts the signal it handed to the work, so the request is cancelled", async () => {
    let signal: AbortSignal | undefined;
    await withTimeout(
      (given) => {
        signal = given;
        return neverResolves();
      },
      10,
      "cancelable",
    ).catch(() => undefined);
    expect(signal?.aborted).toBe(true);
  });

  it("returns the value and leaves the signal alone when the work finishes in time", async () => {
    let signal: AbortSignal | undefined;
    const value = await withTimeout(
      async (given) => {
        signal = given;
        return "extracted";
      },
      1_000,
      "fast",
    );
    expect(value).toBe("extracted");
    expect(signal?.aborted).toBe(false);
  });

  it("propagates a real provider failure rather than reporting it as a timeout", async () => {
    await expect(
      withTimeout(async () => {
        throw new Error("upstream 503");
      }, 1_000, "failing"),
    ).rejects.toThrow("upstream 503");
  });
});

describe("a timed-out case in an evaluation", () => {
  const transcriptCase: TranscriptCase = {
    id: "timeout-case",
    version: "fixture",
    split: "held-out",
    family: "explicit-action-ownership",
    title: "Fixture",
    synthetic: true,
    lines: [{ id: "L001", speaker: "Speaker", text: "line" }],
    transcript: "[L001] Speaker: line",
    lineIds: ["L001"],
    wordCount: 400,
    meetingDate: null,
    timezone: null,
    goldActions: [
      {
        id: "g1",
        task: "send the pack",
        owner: "Devi",
        dueDate: null,
        dueDateText: null,
        status: "open",
        evidenceLineIds: ["L001"],
      },
    ],
    goldDecisions: [],
    acceptableAlternatives: {},
    annotationRationale: "fixture",
    humanReviewed: false,
    reviewerId: null,
  };

  const evaluation = evaluateCase({
    runId: "run",
    transcriptCase,
    output: null,
  });

  it("is recorded as producing nothing, not as an empty but successful output", () => {
    expect(evaluation.produced).toBe(false);
    expect(evaluation.accepted).toBe(false);
    expect(evaluation.acceptanceFailures.join(" ")).toMatch(/no valid output/i);
  });

  it("keeps its gold actions in the denominator so the failure lowers recall", () => {
    expect(evaluation.counts.goldActions).toBe(1);
    expect(evaluation.counts.matchedActions).toBe(0);
    expect(evaluation.metrics.actionRecall.status).toBe("ok");
    if (evaluation.metrics.actionRecall.status === "ok") {
      expect(evaluation.metrics.actionRecall.value).toBe(0);
    }
  });

  it("still counts as an attempted case and keeps its spend in the numerator", () => {
    const run = aggregateEvaluation({
      runId: "run",
      cases: [evaluation],
      totalSpendUsd: 0.06,
      latenciesMs: [30_000],
      recordedReviewMinutes: null,
      assumedHourlyRateUsd: 60,
    });
    expect(run.attemptedCases).toBe(1);
    expect(run.acceptedCases).toBe(0);
    expect(run.costPerAcceptedCase.status).toBe("no-accepted-cases");
    if (run.costPerAcceptedCase.status === "no-accepted-cases") {
      expect(run.costPerAcceptedCase.totalSpendUsd).toBe(0.06);
    }
  });
});

describe("the provider seam in this deployment", () => {
  it("reports that no provider is configured rather than returning a stub", () => {
    const status = getProviderStatus();
    expect(status.configured).toBe(false);
    if (!status.configured) {
      expect(status.reason).toBe(PROVIDER_NOT_CONFIGURED_REASON);
    }
    expect(getExtractionProvider()).toBeNull();
  });
});
