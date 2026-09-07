import { assetSchema, type Asset } from "@/lib/content-validation";
import { z } from "zod";

/**
 * Asset register. Every image on the site is listed here with its provenance,
 * caption, and alt text, so there is one place to audit what is real.
 *
 * `svg-schematic` assets are drawn in code (components/schematics) and are
 * labelled "Concept preview" wherever they appear. They contain no benchmark
 * scores, returns, or user counts. To replace one with a real screenshot, add
 * a `kind: "file"` asset here and point the project's `coverAsset` at it.
 */
const raw: Asset[] = [
  {
    id: "schematic-disrupt-this-business",
    kind: "svg-schematic",
    label: "Concept preview",
    alt: "Schematic of two competing strategic positions. On the left, an incumbent selling project-management seats, with capacity and cash notes. On the right, a challenger selling completed work bundles. Between them, two customer segments are shown choosing between the two offers across four quarterly decisions.",
    caption:
      "Concept preview — the decision scene the game presents: two positions, two customer segments, four quarterly commitments. Parameters are fictional scenario values from the project brief; no result is shown.",
    dataAlternative: [
      "Position A sells seats: priced per team per year, with support cost rising for each team added. Its stated advantage is the installed base.",
      "Position B sells completed work: priced per delivered bundle, with cost falling as delivery automates. Its stated advantage is unit cost.",
      "Both compete for the same fictional market of 800 small teams, which are price sensitive and cheap to switch, and 200 enterprise teams, which weigh reliability first and are costly to switch.",
      "Play runs over four quarters. Each quarter the player commits one move, the opponent's move is then revealed, and the result resolves from stated rules.",
      "After the result, the player switches sides and attacks the strategy they just recorded.",
      "No outcome, score, or currency figure is shown, because none has been produced.",
    ],
    source:
      "Original SVG drawn for this repository from the Disrupt This Business brief (docs/01_Disrupt_This_Business_BRD.md, section 5). No third-party imagery.",
  },
  {
    id: "schematic-the-moat-test",
    kind: "svg-schematic",
    label: "Concept preview",
    alt: "Schematic of a source-to-output comparison. A transcript with numbered speaker lines sits on the left. Two output panels sit on the right: a tagged-line baseline that extracts only explicitly marked lines, and a model-based extraction that proposes decisions, owners, and open questions. Arrows trace each output claim back to a transcript line number.",
    caption:
      "Concept preview — the comparison the investigation is built around: one transcript, two extraction methods, and a line reference behind every claim. The excerpt text is hand-authored placeholder content, not a recorded run.",
    dataAlternative: [
      "The source is a transcript with speaker labels and stable line IDs, shown here as eight lines. Two of them are explicitly tagged: line 3 reads \u201cDECISION: ship Thursday\u201d and line 6 reads \u201cACTION: Priya to draft\u201d.",
      "The baseline method extracts only tagged lines. It returns \u201cship Thursday\u201d from line 3 and \u201cPriya to draft\u201d from line 6, and ignores every untagged line. It is a deterministic string match and sets the floor any model has to beat.",
      "The challenger method returns richer structure: a decision (ship Thursday, current, from line 3), an action (Priya, due unresolved, from line 6), an open question (who signs off, from lines 4 to 5), and one item where the owner was ambiguous and was therefore left null, from line 7.",
      "Every claim in either panel carries the transcript line it came from. Both panels stay blind until the reveal.",
      "No accuracy figure appears, because no benchmark run has been executed.",
    ],
    source:
      "Original SVG drawn for this repository from The Moat Test brief (docs/02_The_Moat_Test_BRD.md, section 5). No third-party imagery.",
  },
  {
    id: "schematic-priced-in",
    kind: "svg-schematic",
    label: "Concept preview",
    alt: "Schematic of a hypothetical expectations map. A grid plots revenue growth on the horizontal axis against operating margin on the vertical axis. A curved band crosses the grid marking the combinations that would satisfy one enterprise-value target. Labelled annotations mark an easier combination, a harder combination, and the operating bridge that translates a chosen cell into required customers and price.",
    caption:
      "Concept preview — the expectations map the workbench produces: growth and margin combinations consistent with one valuation target. Axes are unitless and the target is hypothetical; no company, price, or forecast is shown.",
    dataAlternative: [
      "The horizontal axis is revenue growth and the vertical axis is operating margin. Both are unitless and carry no tick values.",
      "A band crosses the grid from upper left to lower right. Every point on it satisfies the same hypothetical enterprise-value target, so higher required growth trades against lower required margin.",
      "Two points on the band are annotated. One sits at modest growth with high margin; the other at fast growth with thin margin. They are alternative futures consistent with the same target, not a prediction of either.",
      "Selecting a point feeds the operating bridge, which states three requirements: the customers the business must add, the price it must hold per customer, and the contribution the AI initiative must make.",
      "There is no company, price, forecast, or return in the drawing, and the target is hypothetical.",
    ],
    source:
      "Original SVG drawn for this repository from the Priced In brief (docs/03_Priced_In_BRD.md, sections 1 and 4). No third-party imagery.",
  },
];

export const assets: readonly Asset[] = z.array(assetSchema).parse(raw);

export function getAsset(id: string): Asset {
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) {
    throw new Error(`Unknown asset "${id}". Add it to content/assets.ts.`);
  }
  return asset;
}
