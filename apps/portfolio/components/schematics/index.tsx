import { MarketEntryWarRoomSchematic } from "./market-entry-war-room";
import { DisruptThisBusinessSchematic } from "./disrupt-this-business";
import { TheMoatTestSchematic } from "./the-moat-test";
import { NarrativeVsNumbersSchematic } from "./narrative-vs-numbers";
import { PricedInSchematic } from "./priced-in";
import type { SchematicId } from "./ids";

/**
 * Draws the schematic for a registered asset ID.
 *
 * The switch is exhaustive over SchematicId, so adding an ID to
 * components/schematics/ids.ts without drawing it is a TypeScript error.
 */
export function Schematic({ id }: { id: SchematicId }) {
  switch (id) {
    case "schematic-market-entry-war-room":
      return <MarketEntryWarRoomSchematic />;
    case "schematic-disrupt-this-business":
      return <DisruptThisBusinessSchematic />;
    case "schematic-the-moat-test":
      return <TheMoatTestSchematic />;
    case "schematic-narrative-vs-numbers":
      return <NarrativeVsNumbersSchematic />;
    case "schematic-priced-in":
      return <PricedInSchematic />;
  }
}
