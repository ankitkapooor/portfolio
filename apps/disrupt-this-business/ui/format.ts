import type { Role } from "@/domain/schema";

export function formatMoney(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

/** Compact axis labels, e.g. $3.4m or -$141k. */
export function formatMoneyShort(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** Customer counts are fractional equivalents; one decimal is enough. */
export function formatCustomers(value: number): string {
  return value.toFixed(1);
}

export function formatTrait(value: number): string {
  return value.toFixed(2);
}

export const roleLabel: Record<Role, string> = {
  incumbent: "Incumbent",
  challenger: "Challenger",
};

export const roleTagClass: Record<Role, string> = {
  incumbent: "tag tag--incumbent",
  challenger: "tag tag--challenger",
};

export function otherRole(role: Role): Role {
  return role === "incumbent" ? "challenger" : "incumbent";
}
