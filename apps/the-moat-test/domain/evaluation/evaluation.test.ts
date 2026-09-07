import { describe, expect, it } from "vitest";
import type { TranscriptCase } from "@/domain/schemas/corpus";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import {
  ACCEPTANCE_THRESHOLDS,
  aggregateEvaluation,
  costPerAcceptedCase,
  evaluateCase,
  formatCostPerAcceptedCase,
  formatMetric,
  latencySummary,
  reviewInclusiveCost,
  roundTo,
} from "./index";

/**
 * Fixtures are built by hand rather than through `buildCase` so that a metric test
 * does not also have to satisfy the corpus's 400-word rule.
 */
function fixtureCase(overrides: Partial<TranscriptCase> = {}): TranscriptCase {
  const lineIds = ["L001", "L002", "L003", "L004"];
  return {
    id: "fixture-case",
    version: "fixture",
    split: "development",
    family: "explicit-action-ownership",
    title: "Fixture",
    synthetic: true,
    lines: lineIds.map((id) => ({ id, speaker: "Speaker", text: "line" })),
    transcript: lineIds.map((id) => `[${id}] Speaker: line`).join("\n"),
    lineIds,
    wordCount: 400,
    meetingDate: null,
    timezone: null,
    goldActions: [],
    goldDecisions: [],
    acceptableAlternatives: {},
    annotationRationale: "fixture",
    humanReviewed: false,
    reviewerId: null,
    ...overrides,
  };
}

function output(overrides: Partial<ExtractionOutput> = {}): ExtractionOutput {
  return {
    summary: "",
    decisions: [],
    actions: [],
    openQuestions: [],
    uncertainties: [],
    ...overrides,
  };
}

function action(
  id: string,
  task: string,
  extra: Partial<ExtractionOutput["actions"][number]> = {},
) {
  return {
    id,
    task,
    owner: null,
    dueDate: null,
    dueDateText: null,
    status: "open" as const,
    evidenceLineIds: ["L001"],
    ...extra,
  };
}

function goldAction(
  id: string,
  task: string,
  extra: Partial<TranscriptCase["goldActions"][number]> = {},
) {
  return {
    id,
    task,
    owner: null,
    dueDate: null,
    dueDateText: null,
    status: "open" as const,
    evidenceLineIds: ["L001"],
    ...extra,
  };
}

describe("the acceptance fixture from BRD section 7", () => {
  const transcriptCase = fixtureCase({
    goldActions: [
      goldAction("g1", "send the revised contract to the supplier"),
      goldAction("g2", "book the meeting room for Thursday"),
      goldAction("g3", "update the risk register"),
    ],
  });

  const evaluation = evaluateCase({
    runId: "fixture-run",
    transcriptCase,
    output: output({
      actions: [
        action("p1", "send the revised contract to the supplier"),
        action("p2", "Send the revised contract to the supplier."),
        action("p3", "book the meeting room for Thursday"),
        action("p4", "order new laptops for the team"),
      ],
    }),
  });

  it("counts three gold actions, four predictions and two one-to-one matches", () => {
    expect(evaluation.counts.goldActions).toBe(3);
    expect(evaluation.counts.predictedActions).toBe(4);
    expect(evaluation.counts.matchedActions).toBe(2);
  });

  it("reports precision 0.50, recall 0.666667 and F1 0.571429", () => {
    const { actionPrecision, actionRecall, actionF1 } = evaluation.metrics;
    expect(actionPrecision.status).toBe("ok");
    expect(actionRecall.status).toBe("ok");
    expect(actionF1.status).toBe("ok");
    if (
      actionPrecision.status !== "ok" ||
      actionRecall.status !== "ok" ||
      actionF1.status !== "ok"
    ) {
      throw new Error("expected all three metrics to be defined");
    }
    expect(roundTo(actionPrecision.value, 6)).toBe(0.5);
    expect(roundTo(actionRecall.value, 6)).toBe(0.666667);
    expect(roundTo(actionF1.value, 6)).toBe(0.571429);
  });
});

describe("duplicate predictions", () => {
  it("cannot consume the same gold action twice", () => {
    const transcriptCase = fixtureCase({
      goldActions: [goldAction("g1", "publish the schedule")],
    });
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        actions: [
          action("p1", "publish the schedule"),
          action("p2", "publish the schedule"),
          action("p3", "publish the schedule"),
        ],
      }),
    });
    expect(evaluation.counts.matchedActions).toBe(1);
    expect(evaluation.metrics.actionPrecision.status).toBe("ok");
    if (evaluation.metrics.actionPrecision.status !== "ok") return;
    expect(roundTo(evaluation.metrics.actionPrecision.value, 6)).toBe(0.333333);
  });
});

describe("N/A rather than zero or infinity", () => {
  it("reports precision as N/A when nothing was predicted", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase({
        goldActions: [goldAction("g1", "do the thing")],
      }),
      output: output(),
    });
    expect(evaluation.metrics.actionPrecision.status).toBe("not-applicable");
    expect(formatMetric(evaluation.metrics.actionPrecision)).toBe("N/A");
    if (evaluation.metrics.actionPrecision.status !== "not-applicable") return;
    expect(evaluation.metrics.actionPrecision.reason).toMatch(/no denominator/i);
  });

  it("reports recall as N/A when the case has no gold actions", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase(),
      output: output(),
    });
    expect(evaluation.metrics.actionRecall.status).toBe("not-applicable");
    expect(formatMetric(evaluation.metrics.actionRecall)).toBe("N/A");
  });

  it("reports F1 as N/A when either input is N/A", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase(),
      output: output(),
    });
    expect(evaluation.metrics.actionF1.status).toBe("not-applicable");
  });

  it("reports owner accuracy as N/A when no matched action has a gold owner", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase({
        goldActions: [goldAction("g1", "call the vendor")],
      }),
      output: output({ actions: [action("p1", "call the vendor")] }),
    });
    expect(evaluation.metrics.ownerAccuracy.status).toBe("not-applicable");
  });
});

describe("inappropriate specificity", () => {
  const transcriptCase = fixtureCase({
    goldActions: [
      goldAction("g1", "call the vendor"),
      goldAction("g2", "send the pack", { owner: "Devi", dueDate: "2026-09-10" }),
    ],
  });
  const evaluation = evaluateCase({
    runId: "run",
    transcriptCase,
    output: output({
      actions: [
        action("p1", "call the vendor", { owner: "Karl", dueDate: "2026-09-11" }),
        action("p2", "send the pack", { owner: "Devi", dueDate: "2026-09-10" }),
      ],
    }),
  });

  it("counts invented owners separately from owner accuracy", () => {
    expect(evaluation.metrics.ownerAccuracy.status).toBe("ok");
    if (evaluation.metrics.ownerAccuracy.status === "ok") {
      expect(evaluation.metrics.ownerAccuracy.value).toBe(1);
    }
    expect(evaluation.counts.inventedOwner).toBe(1);
    expect(evaluation.counts.goldOwnerUnknown).toBe(1);
  });

  it("counts resolved dates where the gold date is unknown separately", () => {
    expect(evaluation.counts.resolvedDateWhereUnknown).toBe(1);
    expect(evaluation.metrics.dueDateAccuracy.status).toBe("ok");
  });

  it("treats an invented owner as a critical defect", () => {
    expect(
      evaluation.criticalDefects.some(
        (defect) => defect.kind === "fabricated-owner",
      ),
    ).toBe(true);
    expect(evaluation.accepted).toBe(false);
  });
});

describe("citation measures stay distinct", () => {
  const transcriptCase = fixtureCase({
    goldActions: [goldAction("g1", "do the thing")],
  });

  it("fails citation validity when a cited line does not exist", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        actions: [action("p1", "do the thing", { evidenceLineIds: ["L999"] })],
      }),
    });
    expect(evaluation.invalidLineReferences).toEqual(["L999"]);
    expect(evaluation.metrics.citationValidity.status).toBe("ok");
    if (evaluation.metrics.citationValidity.status === "ok") {
      expect(evaluation.metrics.citationValidity.value).toBe(0);
    }
    expect(evaluation.accepted).toBe(false);
  });

  it("keeps full coverage and full validity from implying support", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        actions: [action("p1", "do the thing", { evidenceLineIds: ["L001"] })],
      }),
    });
    expect(evaluation.metrics.citationCoverage.status).toBe("ok");
    expect(evaluation.metrics.citationValidity.status).toBe("ok");
    expect(evaluation.metrics.citationSupport.status).toBe("requires-human-review");
    expect(evaluation.metrics.citationSupport.pendingItems).toBe(1);
  });

  it("reports coverage below one when an item cites nothing", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        actions: [action("p1", "do the thing", { evidenceLineIds: [] })],
      }),
    });
    expect(evaluation.metrics.citationCoverage.status).toBe("ok");
    if (evaluation.metrics.citationCoverage.status === "ok") {
      expect(evaluation.metrics.citationCoverage.value).toBe(0);
    }
    expect(evaluation.metrics.citationValidity.status).toBe("not-applicable");
  });
});

describe("decision handling", () => {
  const transcriptCase = fixtureCase({
    goldDecisions: [
      {
        id: "d1",
        text: "ship on Friday",
        status: "superseded",
        evidenceLineIds: ["L001"],
      },
      {
        id: "d2",
        text: "hold until legal signs off",
        status: "current",
        evidenceLineIds: ["L002"],
      },
    ],
  });

  it("flags an obsolete decision presented as final", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        decisions: [
          {
            id: "p1",
            text: "ship on Friday",
            status: "current",
            evidenceLineIds: ["L001"],
          },
          {
            id: "p2",
            text: "hold until legal signs off",
            status: "current",
            evidenceLineIds: ["L002"],
          },
        ],
      }),
    });
    expect(
      evaluation.criticalDefects.map((defect) => defect.kind),
    ).toContain("obsolete-decision-presented-as-final");
    expect(evaluation.counts.decisionsIncorrectlyFinalized).toBe(1);
  });

  it("flags a missed explicit cancellation", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase,
      output: output({
        decisions: [
          {
            id: "p1",
            text: "ship on Friday",
            status: "superseded",
            evidenceLineIds: ["L001"],
          },
        ],
      }),
    });
    expect(
      evaluation.criticalDefects.map((defect) => defect.kind),
    ).toContain("missed-explicit-cancellation");
  });

  it("flags an invented decision", () => {
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase(),
      output: output({
        decisions: [
          {
            id: "p1",
            text: "we will acquire the supplier",
            status: "current",
            evidenceLineIds: ["L001"],
          },
        ],
      }),
    });
    expect(
      evaluation.criticalDefects.map((defect) => defect.kind),
    ).toContain("invented-decision");
  });
});

describe("cost accounting", () => {
  it("divides total spend across all attempted cases by accepted cases", () => {
    const cost = costPerAcceptedCase(0.12, 3);
    expect(cost.status).toBe("ok");
    if (cost.status !== "ok") return;
    expect(roundTo(cost.valueUsd, 6)).toBe(0.04);
    expect(formatCostPerAcceptedCase(cost)).toBe("$0.04");
  });

  it("says 'No accepted cases' rather than zero or infinity", () => {
    const cost = costPerAcceptedCase(0.12, 0);
    expect(cost.status).toBe("no-accepted-cases");
    expect(formatCostPerAcceptedCase(cost)).toBe("No accepted cases");
    expect(JSON.stringify(cost)).not.toContain("Infinity");
  });

  it("refuses to compute review-inclusive cost without recorded review minutes", () => {
    const value = reviewInclusiveCost({
      totalSpendUsd: 0.12,
      recordedReviewMinutes: null,
      assumedHourlyRateUsd: 60,
    });
    expect(value.status).toBe("not-applicable");
  });

  it("adds recorded review minutes at the assumed rate when they exist", () => {
    const value = reviewInclusiveCost({
      totalSpendUsd: 0.12,
      recordedReviewMinutes: 30,
      assumedHourlyRateUsd: 60,
    });
    expect(value.status).toBe("ok");
    if (value.status !== "ok") return;
    expect(roundTo(value.valueUsd, 2)).toBe(30.12);
  });
});

describe("aggregate reporting", () => {
  it("uses micro totals and never produces a single overall score", () => {
    const caseA = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase({
        id: "a",
        goldActions: [goldAction("g1", "one"), goldAction("g2", "two")],
      }),
      output: output({ actions: [action("p1", "one")] }),
    });
    const caseB = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase({ id: "b" }),
      output: output(),
    });
    const run = aggregateEvaluation({
      runId: "run",
      cases: [caseA, caseB],
      totalSpendUsd: 0,
      latenciesMs: [10, 20, 30],
      recordedReviewMinutes: null,
      assumedHourlyRateUsd: 60,
    });

    expect(run.totals.goldActions).toBe(2);
    expect(run.totals.matchedActions).toBe(1);
    expect(run.metrics.actionRecall.status).toBe("ok");
    expect(run.noActionCaseCount).toBe(1);
    expect(Object.keys(run)).not.toContain("overallScore");
  });

  it("summarises latency with the sample count and the observed range", () => {
    const summary = latencySummary([5, 9, 12, 40]);
    expect(summary.sampleCount).toBe(4);
    expect(summary.p50Ms).toBe(9);
    expect(summary.p95Ms).toBe(40);
    expect(summary.minMs).toBe(5);
    expect(summary.maxMs).toBe(40);
    expect(summary.note).toMatch(/observed range/);
  });
});

describe("acceptance criteria", () => {
  it("requires recall at or above the threshold when gold actions exist", () => {
    expect(ACCEPTANCE_THRESHOLDS.minActionRecall).toBe(0.9);
    const evaluation = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase({
        goldActions: [
          goldAction("g1", "one"),
          goldAction("g2", "two"),
          goldAction("g3", "three"),
        ],
      }),
      output: output({ actions: [action("p1", "one")] }),
    });
    expect(evaluation.accepted).toBe(false);
    expect(evaluation.acceptanceFailures.join(" ")).toMatch(/Action recall/);
  });

  it("accepts an empty case only when nothing was invented", () => {
    const clean = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase(),
      output: output({ summary: "Nothing was agreed." }),
    });
    expect(clean.emptyCase).toBe(true);
    expect(clean.accepted).toBe(true);

    const invented = evaluateCase({
      runId: "run",
      transcriptCase: fixtureCase(),
      output: output({ actions: [action("p1", "buy the building")] }),
    });
    expect(invented.accepted).toBe(false);
  });
});
