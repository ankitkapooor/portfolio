/**
 * Schematic asset IDs, kept in a plain module with no CSS imports so the
 * content validator (plain Node) can read them without loading React or CSS.
 *
 * `index.tsx` types its registry as Record<SchematicId, ComponentType>, so a
 * schematic listed here without a component — or a component whose key is not
 * listed here — is a TypeScript error at build time.
 */
export const schematicIds = [
  "schematic-disrupt-this-business",
  "schematic-the-moat-test",
  "schematic-priced-in",
] as const;

export type SchematicId = (typeof schematicIds)[number];

export function isSchematicId(id: string): id is SchematicId {
  return (schematicIds as readonly string[]).includes(id);
}
