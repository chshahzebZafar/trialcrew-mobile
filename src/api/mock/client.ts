/**
 * Mock API client — in-memory implementation of the TrialCrew API surface the
 * mobile app needs. Mutates cloned fixtures so flows (opt-in, proof, check-in,
 * feedback) persist for the session. Mirrors the real endpoints 1:1 so the hooks
 * in src/api/hooks.ts can later point at a fetch transport with no screen changes.
 */
import {
  broadcastReplies,
  broadcasts,
  browseCampaigns,
  enrollments,
  feedbackQuestions,
  founderApps,
  founderStats,
  founderTesters,
  initialCycles,
  notifications,
  testerProfile,
} from "./fixtures";
import type {
  AppNotification,
  Broadcast,
  BroadcastReply,
  Campaign,
  CheckInDay,
  Cycle,
  DailyCheckIn,
  Enrollment,
  Feedback,
  FeedbackQuestion,
  FounderApp,
  FounderStats,
  FounderTesterRow,
  PublishInput,
  Role,
  SubmitAppInput,
  TesterProfile,
} from "@/types";

import { evaluateIntegrity } from "@/lib/integrity";

const DAY = 24 * 60 * 60 * 1000;
const CYCLE_DAYS = 14;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

async function delay<T>(value: T, ms = 350): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return value;
}

// --- in-memory session state ------------------------------------------------

let profile: TesterProfile = clone(testerProfile);
let cycles: Cycle[] = clone(initialCycles);
const optedInCampaignIds = new Set<string>();

// Founder-side in-memory state
let apps: FounderApp[] = clone(founderApps);
let testers: FounderTesterRow[] = clone(founderTesters);
let enrolls: Enrollment[] = clone(enrollments);
let bcasts: Broadcast[] = clone(broadcasts);
let replies: BroadcastReply[] = clone(broadcastReplies);
let notifs: AppNotification[] = clone(notifications);
let fStats: FounderStats = clone(founderStats);

/** Build 14 daily proof-of-use slots; mark `doneDays` of them done. */
function buildDailyCheckIns(optInMs: number, doneDays: number): DailyCheckIn[] {
  return Array.from({ length: CYCLE_DAYS }, (_, i) => {
    const day = i + 1;
    return day <= doneDays
      ? { day, doneAt: new Date(optInMs + day * DAY).toISOString() }
      : { day };
  });
}

/** Which test day a cycle is on right now (1-based), from optInAt. */
function currentDay(optInAt?: string, now = Date.now()): number {
  if (!optInAt) return 0;
  const elapsed = Math.floor((now - new Date(optInAt).getTime()) / DAY) + 1;
  return Math.min(CYCLE_DAYS, Math.max(1, elapsed));
}

/** Enforce the 2-consecutive-miss auto-drop on an ACTIVE cycle (idempotent). */
function enforceIntegrity(cycle: Cycle): void {
  if (cycle.status !== "ACTIVE") return;
  const { shouldDrop } = evaluateIntegrity(cycle.dailyCheckIns, currentDay(cycle.optInAt));
  if (shouldDrop) cycle.status = "DROPPED";
}

/** Hydrate relative dates once, anchored to "now", so the ACTIVE clock is live. */
(function hydrate() {
  const now = Date.now();
  for (const cycle of cycles) {
    if (cycle.status === "ACTIVE") {
      const optIn = now - 4 * DAY; // mid-cycle: 4 days in
      cycle.optInAt = new Date(optIn).toISOString();
      cycle.completesAt = new Date(optIn + CYCLE_DAYS * DAY).toISOString();
      hydrateCheckInDates(cycle, optIn);
      // Seed an "at risk" state: confirmed up to (today-2), so yesterday is a miss.
      cycle.dailyCheckIns = buildDailyCheckIns(optIn, Math.max(0, currentDay(cycle.optInAt, now) - 2));
      optedInCampaignIds.add(cycle.campaign.id);
    }
    if (cycle.status === "COMPLETED") {
      const optIn = now - 20 * DAY;
      cycle.optInAt = new Date(optIn).toISOString();
      cycle.completesAt = new Date(optIn + CYCLE_DAYS * DAY).toISOString();
      cycle.completedAt = new Date(optIn + CYCLE_DAYS * DAY).toISOString();
      hydrateCheckInDates(cycle, optIn);
      cycle.dailyCheckIns = buildDailyCheckIns(optIn, CYCLE_DAYS);
      if (cycle.feedback) cycle.feedback.submittedAt = cycle.completedAt;
      optedInCampaignIds.add(cycle.campaign.id);
    }
  }
  apps.forEach((app, i) => {
    app.createdAt = new Date(now - (i + 1) * 3 * DAY).toISOString();
    if (app.status === "INVITED") {
      app.publishedAt = new Date(now - 12 * DAY).toISOString();
      app.startDate = new Date(now - 9 * DAY).toISOString();
    } else if (app.status === "ENROLLING") {
      app.publishedAt = new Date(now - 2 * DAY).toISOString();
      app.startDate = new Date(now + 4 * DAY).toISOString();
    }
  });
  enrolls.forEach((e, i) => {
    e.enrolledAt = new Date(now - (10 - (i % 8)) * DAY).toISOString();
  });
  bcasts.forEach((b, i) => {
    b.sentAt = new Date(now - (i === 0 ? 1 : 4) * DAY).toISOString();
  });
  replies.forEach((r, i) => {
    r.sentAt = new Date(now - 1 * DAY + (i + 1) * 3600_000).toISOString();
  });
  notifs.forEach((n, i) => {
    n.createdAt = new Date(now - i * 5 * 3600_000 - 600_000).toISOString();
  });
})();

function hydrateCheckInDates(cycle: Cycle, optInMs: number) {
  for (const ci of cycle.checkIns) {
    ci.scheduledFor = new Date(optInMs + ci.dayNumber * DAY).toISOString();
    if (ci.status === "RESPONDED" && !ci.respondedAt) {
      ci.respondedAt = new Date(optInMs + ci.dayNumber * DAY + 3600_000).toISOString();
    }
  }
}

// --- API surface ------------------------------------------------------------

export const mockApi = {
  getProfile(): Promise<TesterProfile> {
    return delay(clone(profile));
  },

  updateProfile(input: { name?: string; vertical?: string; categories?: string[]; bio?: string }): Promise<TesterProfile> {
    if (input.name !== undefined) profile.name = input.name;
    if (input.vertical !== undefined) profile.vertical = input.vertical;
    if (input.categories !== undefined) profile.categories = input.categories;
    if (input.bio !== undefined) profile.bio = input.bio;
    return delay(clone(profile));
  },

  setPushToken(_token: string): Promise<{ ok: true }> {
    return delay({ ok: true } as const);
  },

  setRole(_isFounder: boolean, _isProfessional: boolean): Promise<{ ok: true }> {
    return delay({ ok: true } as const);
  },

  getFeedbackQuestions(): Promise<FeedbackQuestion[]> {
    return delay(clone(feedbackQuestions));
  },

  getNotifications(): Promise<AppNotification[]> {
    return delay(clone(notifs));
  },

  async markNotificationsRead(): Promise<AppNotification[]> {
    notifs = notifs.map((n) => ({ ...n, read: true }));
    return delay(clone(notifs));
  },

  /** Browse: matched campaigns the tester has NOT yet opted into. */
  getBrowseCampaigns(): Promise<Campaign[]> {
    const available = browseCampaigns.filter(
      (c) => !optedInCampaignIds.has(c.id),
    );
    return delay(clone(available));
  },

  getCycles(): Promise<Cycle[]> {
    cycles.forEach(enforceIntegrity);
    return delay(clone(cycles));
  },

  getCycle(id: string): Promise<Cycle | null> {
    const found = cycles.find((c) => c.id === id) ?? null;
    if (found) enforceIntegrity(found);
    return delay(found ? clone(found) : null);
  },

  /** Opt in to a matched campaign: create/activate the cycle's own 14-day clock. */
  async optIn(campaignId: string): Promise<Cycle> {
    const now = Date.now();
    let cycle = cycles.find((c) => c.campaign.id === campaignId);
    if (!cycle) {
      const campaign = browseCampaigns.find((c) => c.id === campaignId);
      if (!campaign) throw new Error("Campaign not found");
      cycle = {
        id: `cycle_${campaignId}`,
        campaign: clone(campaign),
        status: "MATCHED",
        gmailForCampaign: `sam.tc.${campaign.appName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
        checkIns: [],
        dailyCheckIns: [],
      };
      cycles.push(cycle);
    }
    cycle.optInAt = new Date(now).toISOString();
    cycle.completesAt = new Date(now + CYCLE_DAYS * DAY).toISOString();
    cycle.status = "ACTIVE";
    cycle.checkIns = ([3, 7, 10, 14] as CheckInDay[]).map((d) => ({
      id: `${cycle!.id}_ci${d}`,
      dayNumber: d,
      scheduledFor: new Date(now + d * DAY).toISOString(),
      status: "PENDING" as const,
    }));
    cycle.dailyCheckIns = buildDailyCheckIns(now, 0); // fresh — day 1 pending today
    optedInCampaignIds.add(campaignId);
    profile.acceptedCycles += 1;
    return delay(clone(cycle));
  },

  async submitProof(cycleId: string, screenshotUrl: string): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    cycle.proof = {
      id: `proof_${cycleId}`,
      screenshotUrl,
      verified: false,
      uploadedAt: new Date().toISOString(),
    };
    if (cycle.status === "ACTIVE") cycle.status = "ACTIVE";
    return delay(clone(cycle));
  },

  async respondCheckIn(
    cycleId: string,
    day: CheckInDay,
    response: string,
  ): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    const ci = cycle.checkIns.find((c) => c.dayNumber === day);
    if (!ci) throw new Error("Check-in not found");
    ci.status = "RESPONDED";
    ci.response = response;
    ci.respondedAt = new Date().toISOString();
    return delay(clone(cycle));
  },

  async submitFeedback(
    cycleId: string,
    answers: Feedback["answers"],
  ): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    cycle.feedback = { answers, submittedAt: new Date().toISOString() };
    cycle.status = "COMPLETED";
    cycle.completedAt = new Date().toISOString();
    // Recompute reliability + badge.
    profile.completedCycles += 1;
    profile.reliabilityScore =
      profile.acceptedCycles > 0
        ? profile.completedCycles / profile.acceptedCycles
        : 0;
    profile.badgeTier =
      profile.completedCycles >= 50
        ? "EXPERT"
        : profile.completedCycles >= 20
          ? "SENIOR"
          : profile.completedCycles >= 5
            ? "VERIFIED"
            : "NONE";
    return delay(clone(cycle));
  },

  /** Tester confirms they used the app today (proof-of-use). */
  async dailyCheckIn(cycleId: string): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    const day = currentDay(cycle.optInAt);
    const slot = cycle.dailyCheckIns.find((d) => d.day === day);
    if (slot && !slot.doneAt) slot.doneAt = new Date().toISOString();
    return delay(clone(cycle), 250);
  },

  /** Tester edits the Gmail used for this campaign's Play Store testing. */
  async updateCycleEmail(cycleId: string, gmail: string): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    cycle.gmailForCampaign = gmail.trim();
    return delay(clone(cycle), 250);
  },

  /** Claim a completed cycle's reward → grants the entitlement on the profile. */
  async claimReward(cycleId: string): Promise<Cycle> {
    const cycle = mustGet(cycleId);
    if (cycle.status !== "COMPLETED") throw new Error("Cycle not complete");
    if (cycle.rewardClaimed) return delay(clone(cycle));
    cycle.rewardClaimed = true;
    const DAY90 = 90 * DAY;
    switch (cycle.campaign.rewardType) {
      case "PREMIUM_ACCESS": {
        const base = profile.premiumUntil
          ? Math.max(Date.now(), new Date(profile.premiumUntil).getTime())
          : Date.now();
        profile.premiumUntil = new Date(base + DAY90).toISOString();
        break;
      }
      case "CREDITS":
        profile.credits += 500;
        break;
      case "STIPEND":
        profile.stipendPending += 50;
        break;
    }
    return delay(clone(cycle));
  },

  // ─── Founder side ──────────────────────────────────────────────────────────

  getFounderApps(): Promise<FounderApp[]> {
    return delay(clone(apps));
  },

  getFounderApp(id: string): Promise<FounderApp | null> {
    return delay(clone(apps.find((a) => a.id === id) ?? null));
  },

  getFounderTesters(): Promise<FounderTesterRow[]> {
    return delay(clone(testers));
  },

  getFounderStats(): Promise<FounderStats> {
    return delay(clone(fStats));
  },

  /** Enrollments for one app (founder-facing). */
  getEnrollments(appId: string): Promise<Enrollment[]> {
    return delay(clone(enrolls.filter((e) => e.appId === appId)));
  },

  seedTestEnrollments(appId: string, _count?: number): Promise<Enrollment[]> {
    return delay(clone(enrolls.filter((e) => e.appId === appId)));
  },

  getEnrollment(id: string): Promise<Enrollment | null> {
    return delay(clone(enrolls.find((e) => e.id === id) ?? null));
  },

  async submitApp(input: SubmitAppInput): Promise<FounderApp> {
    const app: FounderApp = {
      id: `fapp_${input.name.toLowerCase().replace(/\s+/g, "")}_${apps.length}`,
      name: input.name.trim(),
      packageName: input.packageName.trim(),
      vertical: input.vertical.trim(),
      feedbackFocus: input.feedbackFocus.trim(),
      description: input.description?.trim(),
      playStoreUrl: input.playStoreUrl?.trim(),
      status: "DRAFT",
      rewardType: input.rewardType,
      minTesters: 16,
      enrolledCount: 0,
      feedbackCount: 0,
      createdAt: new Date().toISOString(),
    };
    apps = [app, ...apps];
    fStats = { ...fStats, appsSubmitted: fStats.appsSubmitted + 1 };
    return delay(clone(app), 500);
  },

  async updateApp(id: string, input: SubmitAppInput): Promise<FounderApp> {
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error("App not found");
    app.name = input.name.trim();
    app.packageName = input.packageName.trim();
    app.vertical = input.vertical.trim();
    app.feedbackFocus = input.feedbackFocus.trim();
    app.description = input.description?.trim();
    app.playStoreUrl = input.playStoreUrl?.trim();
    app.rewardType = input.rewardType;
    return delay(clone(app), 400);
  },

  /** Publish a DRAFT app: set target + start date, open enrollment. */
  async publishApp(id: string, input: PublishInput): Promise<FounderApp> {
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error("App not found");
    app.status = "ENROLLING";
    app.minTesters = input.minTesters;
    app.startDate = input.startDate;
    app.publishedAt = new Date().toISOString();
    fStats = { ...fStats, activeCampaigns: fStats.activeCampaigns + 1 };
    return delay(clone(app), 400);
  },

  /** Export enrolled testers' Gmails once the target is met (→ Play Console). */
  async exportEmails(appId: string): Promise<string[]> {
    const list = enrolls
      .filter((e) => e.appId === appId && e.status !== "DROPPED")
      .map((e) => e.gmail);
    return delay(list);
  },

  /** Mark the cohort invited — the 14-day test begins. */
  async markInvited(id: string, testLink?: string): Promise<FounderApp> {
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error("App not found");
    app.status = "INVITED";
    if (testLink !== undefined) app.testLink = testLink;
    enrolls
      .filter((e) => e.appId === id && e.status === "ENROLLED")
      .forEach((e) => (e.status = "TESTING"));
    return delay(clone(app), 400);
  },

  async endCohort(id: string): Promise<FounderApp> {
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error("App not found");
    app.status = "COMPLETE";
    return delay(clone(app), 400);
  },

  async rateTester(testerRowId: string): Promise<FounderTesterRow> {
    const row = testers.find((t) => t.id === testerRowId);
    if (!row) throw new Error("Tester not found");
    row.rated = true;
    return delay(clone(row));
  },

  async rateEnrollment(id: string): Promise<Enrollment> {
    const e = enrolls.find((x) => x.id === id);
    if (!e) throw new Error("Enrollment not found");
    e.rated = true;
    return delay(clone(e));
  },

  // ─── Broadcasts (founder ↔ cohort, keyed by packageName) ─────────────────────

  getBroadcasts(packageName: string): Promise<Broadcast[]> {
    const list = bcasts
      .filter((b) => b.packageName === packageName)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    return delay(clone(list));
  },

  async sendBroadcast(packageName: string, message: string): Promise<Broadcast> {
    const bc: Broadcast = {
      id: `bc_${bcasts.length}_${packageName}`,
      packageName,
      message: message.trim(),
      sentAt: new Date().toISOString(),
    };
    bcasts = [bc, ...bcasts];
    return delay(clone(bc), 350);
  },

  getReplies(broadcastId: string): Promise<BroadcastReply[]> {
    const list = replies
      .filter((r) => r.broadcastId === broadcastId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    return delay(clone(list));
  },

  async postReply(
    broadcastId: string,
    authorName: string,
    authorRole: Role,
    message: string,
  ): Promise<BroadcastReply> {
    const reply: BroadcastReply = {
      id: `br_${replies.length}_${broadcastId}`,
      broadcastId,
      authorName,
      authorRole,
      message: message.trim(),
      sentAt: new Date().toISOString(),
    };
    replies = [...replies, reply];
    return delay(clone(reply), 300);
  },
};

function mustGet(cycleId: string): Cycle {
  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) throw new Error("Cycle not found");
  return cycle;
}
