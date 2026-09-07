/**
 * The three-step approach, shown as a summary on the homepage and expanded on
 * /method. `body` is deliberately one concrete sentence per step.
 */
export type ApproachStep = {
  title: string;
  body: string;
  detail: string[];
};

export const approachSteps: readonly ApproachStep[] = [
  {
    title: "Investigate the mechanism",
    body: "Work out how the money actually moves before deciding whether the technology matters, because most AI arguments are really arguments about a cost structure nobody has written down.",
    detail: [
      "A question like \u201cis this company exposed to AI?\u201d cannot be answered at that level of abstraction. It has to become a question about a specific mechanism: which cost falls, whose willingness to pay changes, which step in the delivery chain stops needing a person.",
      "So the first pass on every project is structural. In Disrupt This Business that meant writing down how a seat price and a per-outcome price actually compete for the same customer. In Priced In it meant deciding that the model runs backwards from the price, because the requirement is the thing being argued about.",
    ],
  },
  {
    title: "Test the assumptions",
    body: "Build the smallest thing that could show an assumption is wrong, then run it against a baseline dull enough that beating it means something.",
    detail: [
      "An assumption that cannot fail is not an assumption, it is a preference. The test has to be capable of returning an inconvenient answer, and the comparison has to be against something honest rather than something flattering.",
      "That is why The Moat Test measures its challenger against a deterministic tagged-line extractor rather than a commercial product: the baseline is unimpressive, legal to publish, and impossible to argue with. It is also why the economic engine in Disrupt This Business is deterministic — a result nobody can reconstruct is not evidence.",
      "Where a test has not been run, the project says so. All three now run as software, which is a different claim: only The Moat Test has recorded a measured run, and its gold annotations are still unreviewed drafts.",
    ],
  },
  {
    title: "Make the trade-off explicit",
    body: "State what the recommendation costs and what would change it, so the reader is disagreeing with a position rather than with a tone.",
    detail: [
      "Every case page carries a Trade-off and an Uncertainty in its opening brief, before the long-form argument starts. Both are there so a reader can find the weakest part of the position quickly instead of hunting for it.",
      "The same rule applies to conclusions. Where the evidence does not support one yet, Position reads \u201cInvestigation in progress\u201d and explains the test that would settle it. A confident recommendation with nothing behind it would be the easiest thing to write and the least useful thing to read.",
    ],
  },
];
