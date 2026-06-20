/**
 * Cycle integrity rules — the anti-fakery backbone.
 *
 * A tester must confirm real in-app use each day. Two consecutive missed days
 * drops the cycle (no reward). One recent miss = "at risk".
 */
import type { DailyCheckIn } from "@/types";

export interface Integrity {
  missedDays: number[]; // all past days with no confirmation
  consecutiveRecent: number; // misses in the streak ending at (today - 1)
  atRisk: boolean; // exactly one recent miss — one more drops the cycle
  shouldDrop: boolean; // two consecutive recent misses
}

export function evaluateIntegrity(daily: DailyCheckIn[], today: number): Integrity {
  const missedDays = daily.filter((d) => d.day < today && !d.doneAt).map((d) => d.day);

  let consecutiveRecent = 0;
  for (let day = today - 1; day >= 1; day--) {
    const slot = daily.find((s) => s.day === day);
    if (slot && !slot.doneAt) consecutiveRecent++;
    else break;
  }

  return {
    missedDays,
    consecutiveRecent,
    atRisk: consecutiveRecent === 1,
    shouldDrop: consecutiveRecent >= 2,
  };
}
