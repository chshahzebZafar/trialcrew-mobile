/** Time helpers for the per-cycle 14-day countdown. */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export interface Remaining {
  done: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
}

export function remainingUntil(iso?: string, now: number = Date.now()): Remaining {
  if (!iso) return { done: false, days: 0, hours: 0, minutes: 0, totalMs: 0 };
  const totalMs = Math.max(0, new Date(iso).getTime() - now);
  return {
    done: totalMs <= 0,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    minutes: Math.floor((totalMs % HOUR) / MIN),
    totalMs,
  };
}

/** Fraction of the 14-day cycle elapsed (0..1), for progress bars. */
export function cycleProgress(
  optInAt?: string,
  completesAt?: string,
  now: number = Date.now(),
): number {
  if (!optInAt || !completesAt) return 0;
  const start = new Date(optInAt).getTime();
  const end = new Date(completesAt).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function formatCountdown(r: Remaining): string {
  if (r.done) return "Complete";
  if (r.days > 0) return `${r.days}d ${r.hours}h`;
  if (r.hours > 0) return `${r.hours}h ${r.minutes}m`;
  return `${r.minutes}m`;
}
