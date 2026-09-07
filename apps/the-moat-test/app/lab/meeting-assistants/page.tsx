import type { Metadata } from "next";
import Link from "next/link";
import { ILLUSTRATIVE_OUTPUTS } from "@/content/illustrative-outputs";
import type { ExtractionOutput } from "@/domain/schemas/extraction";
import type { PanelSource } from "@/domain/schemas/comparison";
import { ILLUSTRATIVE_CHALLENGER, METHODS } from "@/domain/methods";
import { CORPUS_VERSION, LAB_SAMPLE_IDS, labSamples } from "@/experiments/corpus";
import { getProviderStatus } from "@/server/providers";
import { APP_VERSION } from "@/lib/app-meta";
import { DataModeBadge, SyntheticBadge } from "@/ui/Badges";
import { Lab } from "@/ui/lab/Lab";
import type { PanelDescriptor } from "@/ui/lab/Comparison";

export const metadata: Metadata = {
  title: "Lab: meeting assistants",
  description:
    "Run the deterministic baseline on a synthetic transcript or your own, compare it blind against a hand-authored illustrative output, and export the result with its limitations attached.",
};

/**
 * Server boundary for the lab.
 *
 * `labSamples()` returns the gold-free projection of each case. Gold annotations
 * stay on this side of the boundary and are never serialised into the client
 * payload; `scripts/validate-content.ts` fails the build if a client component
 * reaches for them directly.
 */
export default function LabPage() {
  const samples = labSamples();
  const provider = getProviderStatus();

  const illustrativeOutputs: Record<string, ExtractionOutput> =
    Object.fromEntries(
      LAB_SAMPLE_IDS.filter((id) => ILLUSTRATIVE_OUTPUTS[id]).map((id) => [
        id,
        ILLUSTRATIVE_OUTPUTS[id],
      ]),
    );

  const baselineMethod = METHODS["tagged-transcript-baseline"];
  const aiMethod = METHODS["ai-structured-extraction"];

  const descriptors: Record<PanelSource, PanelDescriptor> = {
    "tagged-transcript-baseline": {
      name: baselineMethod.name,
      version: baselineMethod.version,
      dataMode: "recorded-experiment",
      isNot: baselineMethod.isNot,
    },
    "illustrative-challenger": {
      name: ILLUSTRATIVE_CHALLENGER.name,
      version: ILLUSTRATIVE_CHALLENGER.version,
      dataMode: "illustrative-demo",
      isNot: ILLUSTRATIVE_CHALLENGER.isNot,
    },
    "ai-structured-extraction": {
      name: aiMethod.name,
      version: aiMethod.version,
      dataMode: "live-trial",
      isNot: aiMethod.isNot,
    },
  };

  return (
    <div className="page prose lab-page">
      <p className="articleKicker">
        <Link href="/investigations/meeting-assistants">The Moat Test</Link>
      </p>
      <h1 className="pageTitle">Lab: meeting extraction</h1>
      <p className="measure pageStandfirst">
        Pick one of six synthetic transcripts, or paste your own, and read what the
        deterministic baseline actually pulls out of it. Then compare that against a
        hand-authored output of the shape the extraction contract asks for, without
        being told which is which until you have decided.
      </p>
      <p className="badgeRow">
        <SyntheticBadge />
        <DataModeBadge mode="recorded-experiment" />
        <DataModeBadge mode="illustrative-demo" />
      </p>
      <p className="measure note noteLimitation">
        Nothing here is a benchmark result. The scored runs are in{" "}
        <Link href="/investigations/meeting-assistants#results">section 5</Link> of
        the investigation; this page shows one transcript at a time and scores
        nothing.
      </p>

      <Lab
        samples={samples}
        illustrativeOutputs={illustrativeOutputs}
        descriptors={descriptors}
        corpusVersion={CORPUS_VERSION}
        appVersion={APP_VERSION}
        providerReason={provider.configured ? null : provider.reason}
      />
    </div>
  );
}
