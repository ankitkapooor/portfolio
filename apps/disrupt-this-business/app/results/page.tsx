import type { Metadata } from "next";
import ResultsClient from "./ResultsClient";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Trajectories, decision ledger, liquidity, customer mix and export for a completed run.",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
