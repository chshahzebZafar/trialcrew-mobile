/**
 * Design tokens (TS). Modern "SaaS-mobile / high-tech boutique" system per the
 * ui-ux-pro-max design intelligence: warm stone neutrals, one electric-indigo
 * accent, green for "passed", gold rationed for premium/verified. Mirror of
 * tailwind.config.js — keep in sync.
 *
 * Legacy keys retained + repointed so older references degrade gracefully.
 */

export const colors = {
  bg: "#FAFAF9", // warm stone-50 background
  paper: "#FAFAF9",
  porcelain: "#FAFAF9",
  card: "#FFFFFF",
  sand: "#F5F5F4", // stone-100 — insets / tracks / unselected
  white: "#FFFFFF",
  line: "#E7E5E4", // stone-200 hairline
  lineStrong: "#D6D3D1", // stone-300

  ink: "#1C1917", // stone-900 text + primary fill
  inkSoft: "#44403C", // stone-700
  midnight: "#1C1917",
  midnightDeep: "#0C0A09",
  slate: "#78716C", // stone-500 secondary
  slateLight: "#A8A29E", // stone-400 tertiary

  indigo: "#4F46E5", // electric indigo — the accent
  indigoBright: "#6366F1",
  indigoSoft: "#EEF2FF",
  indigoInk: "#3730A3",

  positive: "#16A34A", // green — "passed"
  positiveSoft: "#DCFCE7",
  // legacy lime aliases → green
  lime: "#16A34A",
  limeDeep: "#15803D",
  limeBright: "#22C55E",

  gold: "#B45309", // amber-700 — premium / verified (rationed)
  goldSoft: "#FEF3C7",

  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  clay: "#DC2626",
  claySoft: "#FEE2E2",
} as const;

/** Subtle modern gradients (tasteful — accent CTA + glass touches only). */
export const gradients = {
  indigo: ["#6366F1", "#4F46E5"] as const,
  indigoDeep: ["#4F46E5", "#4338CA"] as const,
  lime: ["#22C55E", "#16A34A"] as const,
  gold: ["#D97706", "#B45309"] as const,
  midnight: ["#292524", "#1C1917"] as const,
  paper: ["#FFFFFF", "#FAFAF9"] as const,
};

/** Spring config — tactile, natural (per ui-ux-pro-max effects guidance). */
export const spring = { mass: 1, damping: 16, stiffness: 170 } as const;
export const springSoft = { mass: 1, damping: 18, stiffness: 130 } as const;

import type { CycleStatus, CheckInStatus } from "@/types";

/** Semantic status pills. */
export const cycleStatusMeta: Record<
  CycleStatus,
  { label: string; bg: string; fg: string }
> = {
  MATCHED: { label: "Matched", bg: colors.sand, fg: colors.slate },
  INVITED: { label: "Invited", bg: colors.sand, fg: colors.slate },
  INSTALLED: { label: "Installed", bg: colors.sand, fg: colors.slate },
  ACTIVE: { label: "Active", bg: colors.indigoSoft, fg: colors.indigoInk },
  COMPLETED: { label: "Passed", bg: colors.positiveSoft, fg: colors.positive },
  DROPPED: { label: "Dropped", bg: colors.dangerSoft, fg: colors.danger },
};

export const checkInStatusMeta: Record<
  CheckInStatus,
  { label: string; bg: string; fg: string }
> = {
  PENDING: { label: "Pending", bg: colors.sand, fg: colors.slate },
  SENT: { label: "Awaiting reply", bg: colors.indigoSoft, fg: colors.indigoInk },
  RESPONDED: { label: "Responded", bg: colors.positiveSoft, fg: colors.positive },
  MISSED: { label: "Missed", bg: colors.dangerSoft, fg: colors.danger },
};
