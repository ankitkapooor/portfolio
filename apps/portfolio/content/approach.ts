/** The five-step discipline shared across the portfolio. */
export type ApproachStep = {
  title: string;
  body: string;
  detail: string[];
};

export const approachSteps: readonly ApproachStep[] = [
  {
    title: "Frame the decision",
    body: "Start with the decision, not the technology: what choice is being made, what alternatives exist, and what would cause one option to beat another?",
    detail: [
      "Strategic questions usually arrive too broad to analyze directly. Convert them into a decision with explicit objectives, alternatives, constraints, and failure conditions before choosing tools or data.",
    ],
  },
  {
    title: "Structure the ambiguity",
    body: "Use AI where interpretation is genuinely required, then expose the structured assumptions it produced so they can be corrected rather than trusted implicitly.",
    detail: [
      "Examples include translating a business description into target-customer assumptions or extracting strategic priorities from management language. The output of this step should remain inspectable and editable wherever practical.",
    ],
  },
  {
    title: "Ground it in evidence",
    body: "Connect the structured question to data, documented assumptions, or explicit economic rules rather than allowing generated language to become evidence.",
    detail: [
      "Evidence may include Census observations, SEC filings, XBRL facts, financial statements, benchmark outputs, or deliberately fictional scenario parameters. The source and data mode must remain visible.",
    ],
  },
  {
    title: "Make the trade-offs inspectable",
    body: "Put weights, formulas, thresholds, missing information, and alternatives where the reader can see what is driving the answer.",
    detail: [
      "A useful strategic model should make disagreement more precise. If changing one weight flips the recommendation, that is part of the finding rather than an inconvenience to hide.",
    ],
  },
  {
    title: "Stress-test the answer",
    body: "Try to break the conclusion by moving the assumptions, reversing the perspective, or searching for the conditions under which the recommendation fails.",
    detail: [
      "Across the portfolio this appears in different forms: Monte Carlo sensitivity, role reversal, challenger tests, narrative-versus-financial evidence, and Break My Thesis. A conclusion that survives an explicit attempt to invalidate it is more useful than one that was only optimized to look persuasive.",
    ],
  },
];
