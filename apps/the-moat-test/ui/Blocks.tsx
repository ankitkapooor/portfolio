import type { ReactNode } from "react";
import type { Block } from "@/domain/schemas/investigation";
import { EvidenceRefs } from "./EvidenceRefs";

export type SlotName = Extract<Block, { kind: "slot" }>["slot"];

/**
 * Renders an article section's blocks. A `slot` block is filled by the page, which
 * keeps interactive components out of the content module.
 */
export function Blocks({
  blocks,
  slots,
}: {
  blocks: readonly Block[];
  slots: Partial<Record<SlotName, ReactNode>>;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "paragraph") {
          return (
            <p key={key} className="measure articleParagraph">
              {block.text}
              {block.evidenceIds ? <EvidenceRefs ids={block.evidenceIds} /> : null}
            </p>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={key} className="measure articleList">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {block.evidenceIds ? (
                <li className="articleListRefs">
                  <EvidenceRefs ids={block.evidenceIds} />
                </li>
              ) : null}
            </ul>
          );
        }
        if (block.kind === "callout") {
          return (
            <aside
              key={key}
              className={`measure note${block.tone === "limitation" ? " noteLimitation" : ""}`}
            >
              <p className="calloutTitle">
                <span className="calloutMark">
                  {block.tone === "limitation" ? "Limitation" : "Note"}
                </span>
                {block.title}
              </p>
              <p>
                {block.text}
                {block.evidenceIds ? (
                  <EvidenceRefs ids={block.evidenceIds} />
                ) : null}
              </p>
            </aside>
          );
        }
        return <div key={key}>{slots[block.slot] ?? null}</div>;
      })}
    </>
  );
}
