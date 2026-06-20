/**
 * Founder cohort analytics — derived entirely from enrollments + the app's start
 * date. No new data source; pure functions so the real API can reuse them.
 */
import type { Enrollment } from "@/types";

const DAY = 86400000;

/** Which test day (1–14) the cohort is on, from the app's start date. 0 = not started. */
export function testDay(startDate?: string, now = Date.now()): number {
  if (!startDate) return 0;
  const d = Math.floor((now - new Date(startDate).getTime()) / DAY) + 1;
  return Math.min(14, Math.max(0, d));
}

export interface CohortAnalytics {
  day: number;
  daysRemaining: number;
  total: number;
  completedCount: number;
  droppedCount: number;
  testingCount: number;
  avgDays: number;
  onTrack: number; // testing, on pace (+ completed)
  atRisk: number; // exactly one day behind
  behind: number; // 2+ behind (still testing)
  completionForecast: number; // %
  dailyActiveRate: number; // %
  dropRate: number; // %
}

export function computeAnalytics(enr: Enrollment[], startDate?: string, now = Date.now()): CohortAnalytics {
  const day = testDay(startDate, now);
  const expected = Math.max(0, day - 1); // confirmations expected by now (today still pending)

  const total = enr.length;
  const dropped = enr.filter((e) => e.status === "DROPPED");
  const completed = enr.filter((e) => e.status === "COMPLETED");
  const testing = enr.filter((e) => e.status === "TESTING");
  const active = enr.filter((e) => e.status !== "DROPPED");

  const avgDays = active.length
    ? active.reduce((s, e) => s + e.dailyDone, 0) / active.length
    : 0;

  const onTrackTesting = testing.filter((e) => e.dailyDone >= expected).length;
  const atRisk = expected >= 1 ? testing.filter((e) => e.dailyDone === expected - 1).length : 0;
  const behind = Math.max(0, testing.length - onTrackTesting - atRisk);
  const onTrack = onTrackTesting + completed.length;

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

  return {
    day,
    daysRemaining: Math.max(0, 14 - day),
    total,
    completedCount: completed.length,
    droppedCount: dropped.length,
    testingCount: testing.length,
    avgDays,
    onTrack,
    atRisk,
    behind,
    completionForecast: pct(onTrack, total),
    dailyActiveRate: pct(onTrack, active.length),
    dropRate: pct(dropped.length, total),
  };
}
