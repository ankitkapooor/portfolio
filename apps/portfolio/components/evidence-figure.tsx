import { getAsset } from "@/content/assets";
import { Schematic } from "@/components/schematics";
import { isSchematicId } from "@/components/schematics/ids";
import styles from "./evidence-figure.module.css";

type EvidenceFigureProps = {
  assetId: string;
  /** Show the provenance record. On by default on case pages. */
  showSource?: boolean;
};

/**
 * Renders a registered asset with its label, caption, non-visual alternative,
 * and optionally its provenance record.
 *
 * The drawing itself is aria-hidden; the wrapper carries role="img" and the
 * asset's alt text, so assistive technology gets one coherent description
 * instead of a pile of stray SVG labels.
 */
export function EvidenceFigure({
  assetId,
  showSource = false,
}: EvidenceFigureProps) {
  const asset = getAsset(assetId);

  if (asset.kind !== "svg-schematic") {
    throw new Error(
      `Asset "${assetId}" is kind "${asset.kind}". EvidenceFigure currently renders schematics only; see README.md, "Replacing a concept preview".`,
    );
  }

  if (!isSchematicId(assetId)) {
    throw new Error(
      `No schematic registered for asset "${assetId}". Add it to components/schematics/ids.ts and draw it in components/schematics/index.tsx.`,
    );
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <span className={styles.badge}>{asset.label}</span>
        <div className={styles.viewport} role="img" aria-label={asset.alt}>
          <Schematic id={assetId} />
        </div>
      </div>
      <figcaption className={styles.figcaption}>
        <p className={styles.caption}>{asset.caption}</p>
        <p className={styles.panNote}>
          Drawn wider than this screen — scroll the figure sideways, or read it
          in words below.
        </p>
        <details className={styles.alternative}>
          <summary>What this figure shows, in words</summary>
          <ul className={styles.alternativeList}>
            {asset.dataAlternative.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
        {showSource ? <p className={styles.source}>{asset.source}</p> : null}
      </figcaption>
    </figure>
  );
}
