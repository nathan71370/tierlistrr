// Default tier rows for a freshly created list — the design system's
// training-zone palette, most intense (S) to calmest (D).
export const DEFAULT_TIERS: { label: string; color: string }[] = [
  { label: "S", color: "#b84527" }, // z5
  { label: "A", color: "#d85b3d" }, // z4
  { label: "B", color: "#e89178" }, // z3
  { label: "C", color: "#6b8e65" }, // z2
  { label: "D", color: "#b9c6b3" }, // z1
];

// Palette offered when editing a tier's color (zones + warm neutrals).
export const TIER_COLORS = [
  "#b84527",
  "#d85b3d",
  "#e89178",
  "#b9c6b3",
  "#6b8e65",
  "#4d6b48",
  "#4a4340",
  "#8a8076",
];

export const POOL_ID = "__pool__";
