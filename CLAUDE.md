# TrialCrew Mobile — Project Context

**App:** TrialCrew (trialcrew.app) — niche-first app-testing & domain-feedback platform.
This is the **tester-first mobile app** (the professional/tester side of the marketplace; founders live on web).

A tester's job: get matched to an app campaign → install it → prove it (Day-0) → stay engaged
for a real **14-day Google Play closed-test cycle** → answer periodic check-ins → submit structured
feedback. Doing this earns a reliability score + badge tier.

> Passing closed testing is a *byproduct* of genuine testing, never the goal. Keeps it Play-policy-safe.

---

## Core domain rule (drives everything)

**Cycle = one tester × one campaign.** Each Cycle has its **own** `optInAt` timestamp and its **own
14-day countdown** to `completesAt`. There is NO shared/batch clock — Google counts opt-in time per
tester. Every countdown rendered in the app is per-cycle.

---

## Tech stack

- **Expo** + **Expo Router** (file-based routing)
- **NativeWind** (Tailwind for RN) using the shared design tokens below
- **TanStack Query** for server state
- **Clerk Expo SDK** for auth — *stubbed for now*
- **Expo Push** for check-in notifications — *stubbed for now*
- **Expo Camera / ImagePicker** + **R2 signed URLs** for Day-0 proof — *stubbed for now*
- TypeScript strict everywhere

## Current build phase

- **Data:** MOCK FIRST. All data comes from `src/api/mock/` fixtures via a mock client.
  The TanStack Query hooks in `src/api/` are written so the transport can be swapped to the real
  Fastify API later without touching screens.
- **Integrations:** Clerk auth, Expo Push, and R2 upload are REAL (env-gated); they sit behind interfaces in `src/lib/`
  so screens/flows can be built and run without native setup. Real implementations land later.
- **Focus:** navigation, screens, components, the live countdown, status machine, feedback form.

---

## Navigation (Expo Router)

```
app/
  _layout.tsx            Root: providers + the gate (onboarding → auth → tabs)
  index.tsx              Entry redirect, routes from hydrated store state
  onboarding.tsx         3-slide swipeable intro (first launch only)
  (auth)/
    _layout.tsx          Auth stack
    sign-in.tsx          Email/password sign-in (+ "Continue as tester" demo)
    sign-up.tsx          Name/email/password account creation
  (tabs)/
    _layout.tsx          Bottom tab navigator
    index.tsx            Dashboard — apps matched to this tester (beautiful cards)
    cycles.tsx           My Cycles — active cycle cards w/ live countdown
    profile.tsx          Profile — badges, portfolio link, premium status
  cycle/
    [id].tsx             Cycle detail — the full workflow
```

**Flow:** first launch → `onboarding` → `(auth)/sign-in` → `(tabs)`.
**Gate:** `app/_layout.tsx` waits for the persisted `auth` + `onboarding` stores to
hydrate, then redirects. Both flags persist via AsyncStorage (`src/lib/storage.ts`), so
onboarding shows once and the session survives relaunches.
**Tabs:** Dashboard · My Cycles · Profile.
**Detail stack:** `cycle/[id]` handles opt-in → Day-0 proof → check-in responses → feedback form.

## Auth (Clerk — env-gated)

`useAuth()` (`src/lib/auth.ts`) reads a shared `AuthContext` fed by ONE provider chosen in
`app/_layout.tsx` via `AuthProviders` (`src/lib/authProviders.tsx`):
- **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set → Clerk** (`@clerk/clerk-expo`): `ClerkProvider`
  + an adapter mapping Clerk's hooks into the context and registering a **token bridge**
  (`src/lib/clerk.ts` `getSessionToken`) that `src/api/config.ts` uses for the `Authorization`
  header. Sign-up does email-code verification; the name is stored in `unsafeMetadata.fullName`.
- **unset → stub** (the old persisted store, accepts any creds) — so the app still runs keyless.

The sign-in/sign-up screens (`app/(auth)/`) render a **Clerk or Stub variant** by `CLERK_ENABLED`
(component choice at the default export — no conditional hooks). Token cache = `expo-secure-store`.

`.env` holds `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (publishable key only — the secret key lives
solely in the backend). Clerk auth is independent of the data source: it works with the mock
(default) or the real backend.

## Dual roles (Tester ⟷ Founder)

One person holds both roles and toggles the **active** role. The shell (3 tabs + profile)
is shared; **tab content + the tab bar's labels/icons swap by role**:

| Tab | Tester | Founder |
|-----|--------|---------|
| 1 | Discover (apps to test) | My Apps (submitted apps + Submit) |
| 2 | My Cycles | Testers (monitor cycles, rate) |
| 3 | Profile (shared, role-aware) | Profile (shared, role-aware) |

- Tab files (`app/(tabs)/index.tsx`, `cycles.tsx`) are thin: `useIsFounder() ? <Founder…/> : <Tester…/>`.
  Screen bodies live in `src/screens/` (Discover, MyCycles, FounderApps, FounderTesters).
- `app/submit-app.tsx` — founder's new-app form (creates a DRAFT, modal route).

### Founder app lifecycle (`app/campaign/[id].tsx`)
`DRAFT → ENROLLING → INVITED → COMPLETE`
- **DRAFT:** publish flow — pick tester target (12/16/20) + start date → `publishApp` → ENROLLING.
- **ENROLLING:** live `enrolled / target` counter + enrolled-tester list. When target met →
  **Export tester Gmails** (native Share sheet → Play Console) + **Mark invited** → INVITED.
- **INVITED:** 14-day test running; tap a tester → `app/enrollment/[id].tsx` (per-tester
  **daily proof-of-use grid** + structured feedback + rate).
- Founder data is mock fixtures (`enrollments`, `founderApps`) via TanStack Query.

### Tester daily proof-of-use (`app/cycle/[id].tsx`)
During an ACTIVE cycle the tester sees a 14-tile daily tracker + a once-per-day
**"I used the app today"** confirm (`dailyCheckIn`, only today's slot unlocks). Plus an
**editable Play Store Gmail** (validated `@gmail.com`) with the "this is your Google Play
account" warning (`updateCycleEmail`). `Cycle.dailyCheckIns` holds the 14 slots.

### Integrity backbone (`src/lib/integrity.ts`)
`evaluateIntegrity(dailyCheckIns, today)` → one recent missed day = **at risk** (banner);
**two consecutive misses → cycle auto-DROPPED** (no reward). The mock client enforces the
drop on every `getCycle(s)` read (`enforceIntegrity`). Missed days render red (✕) in the grid.
Founder side: a DROPPED enrollment shows a **backfill** banner on the campaign detail
(slot reopened). The seeded ACTIVE cycle is intentionally "at risk" (one miss) to demo it.

### Reward escrow + broadcasts
- **Reward escrow:** founder picks a `rewardType` (Premium / Credits / Stipend) when submitting
  an app (`SubmitAppInput.rewardType`, `FounderApp.rewardType`). Tester cycle detail shows a
  **Your reward** section: `lock` while ACTIVE ("held in escrow"), `gift`/gold when COMPLETED
  ("unlocked"), `x`/danger when DROPPED ("forfeited"). `RewardChip` + `rewardMeta` in
  `src/components/Reward.tsx`.
- **Broadcasts (founder → cohort):** keyed by `packageName` (links founder app ↔ tester cycle,
  both share it). Founder campaign detail has a composer → `sendBroadcast`; tester cycle detail
  shows **Updates from the team** (`useBroadcasts(cycle.campaign.packageName)`). Mock store
  `broadcasts` in fixtures.

### Founder analytics
`src/lib/founderAnalytics.ts` `computeAnalytics(enrollments, startDate)` — pure, derived from
enrollment `dailyDone` + the app start date (no new data). `CohortHealth`
(`src/components/CohortHealth.tsx`) renders it on the campaign detail for INVITED apps:
completion forecast %, daily-active %, avg days confirmed, drop rate, and a 3-colour
on-track / at-risk / behind engagement bar. `testDay()` maps start date → current test day.

### Push reminders (REAL — expo-notifications)
`src/lib/push.ts` is now real: foreground handler (module load), Android channel, permissions,
best-effort remote token (`registerPushToken`, swallows Expo-Go failures), and the working
feature — **local repeating daily check-in reminders** (`scheduleDailyCheckInReminder(h,m)` /
`cancelDailyCheckInReminder`). Preference in `src/stores/reminderStore.ts` (Zustand+persist);
UI = `RemindersCard` in the tester profile (toggle + 9am/1pm/7pm presets). `expo-notifications`
plugin in app.json. NOTE: remote push needs a dev build (Expo Go dropped it); local works in Go.

### Reward fulfillment
`api.claimReward(cycleId)` (only when COMPLETED): sets `cycle.rewardClaimed` and grants the
entitlement on `TesterProfile` — PREMIUM_ACCESS → +90d `premiumUntil`, CREDITS → +500 `credits`,
STIPEND → +$50 `stipendPending`. Tester cycle detail "Your reward" → **Claim** → granted state;
profile shows a **Rewards** card (premium/credits/stipend). `useClaimReward`.

### Dashboard + topbar + notifications
Tester dashboard (`src/screens/DiscoverScreen.tsx`) is modern/bento: `TopBar`
(`src/components/TopBar.tsx` — avatar, time-based greeting + name, notification bell with
unread `PulseDot`), a gradient **active-cycle spotlight** (tap → cycle), a 3-tile stat bento
(reliability / completed / to-test), then the app list. Bell → `app/notifications.tsx`
(marks read on open). Notifications: `AppNotification` model, `useNotifications` /
`useMarkNotificationsRead`, mock `notifications` fixture.

Push (`src/lib/push.ts`) is now **Expo-Go-safe**: lazy-`require`s expo-notifications and skips
the remote-token path in Expo Go (was erroring on launch); local daily reminders still work.

### Backend + real client (wired)
A real **Fastify + Zod** backend lives in `../backend` (in-memory store, `npm run dev`, :4000),
Prisma/Postgres schema ready to adopt. The mobile **real HTTP client is implemented**
(`src/api/realClient.ts`, on `src/api/config.ts`'s `http()`) and typechecks against the `Api`
contract; its route paths match `backend/src/routes.ts` exactly.

`src/api/client.ts` selects the source from env:
- `EXPO_PUBLIC_USE_BACKEND="true"` → real client (`EXPO_PUBLIC_API_URL` = backend base URL)
- unset/false → in-memory mock (**default — app works with no backend**)

To run on the backend: copy `.env.example` → `.env`, set the URL (LAN IP for a physical
device / `10.0.2.2` for Android emulator), start the backend, then `npx expo start --clear`.
See `backend/README.md`.

### Broadcast threads (two-way)
`BroadcastReply` keyed by `broadcastId`; `api.getReplies` / `api.postReply(id, name, role, msg)`.
`src/components/BroadcastThread.tsx` (shared) renders a broadcast + expandable replies + composer;
used on the founder campaign detail (viewerRole FOUNDER) and tester cycle detail (viewerRole
TESTER). `useBroadcastReplies` / `usePostReply`.
- Role toggle: `RoleToggle` (animated segmented control) in Profile → `setRole`.
- **Creative switch animation:** `RoleTransition` (mounted in root `_layout`) plays a
  circular color reveal + role identity on every toggle (`switchSeq` drives it; never fires
  on cold start). Founder = indigo, Tester = green.

## State management

- **Zustand** (`src/stores/roleStore.ts`) — active role, persisted (`tc.role`) via AsyncStorage.
  `useRole()` / `useIsFounder()` selectors; `setRole`/`toggleRole` bump `switchSeq` for the overlay.
  Root layout gates on `roleStore.hydrated` alongside auth/onboarding.
- **TanStack Query** — all server data (tester + founder), via `src/api/hooks.ts`.
- `auth` / `onboarding` keep their own `useSyncExternalStore` stores (pre-Zustand; could migrate).

---

## Cycle status machine (tester-visible)

`MATCHED → INVITED → INSTALLED → ACTIVE → COMPLETED`   (or `DROPPED`)

- **opt-in:** sets `optInAt=now`, `completesAt=now+14d`, status → `ACTIVE`. Starts that cycle's clock.
- **Day-0 proof:** screenshot upload (camera/library → signed url → record InstallProof).
- **check-ins:** scheduler fires at **+3d / +7d / +10d / +14d**. Tester responds per check-in.
  Unanswered within 24h → `MISSED`. **Two consecutive misses → cycle `DROPPED`** (no reward).
- **feedback:** fixed structured question set, submitted once per cycle.

## Reliability & badges

- `reliabilityScore = completedCycles ÷ acceptedCycles`
- Badge tiers by completed cycles: **VERIFIED = 5 · SENIOR = 20 · EXPERT = 50** (else `NONE`).

---

## Design system — modern "SaaS-mobile / high-tech boutique"

Direction validated by the **ui-ux-pro-max** skill (`~/.claude/skills/ui-ux-pro-max`; run its
`search.py … --design-system` for recommendations). Warm **stone** neutrals + ONE **electric
indigo** accent, **green** for "passed", **gold** rationed for premium/verified. Tactile +
modern: spring press, haptics, soft shadows, glass-ish surfaces, staggered entrances. Source of
truth: `tailwind.config.js` + `src/theme/tokens.ts`.

| Token | Value | Use |
|-------|-------|-----|
| `bg` (`paper`/`porcelain` alias) | `#FAFAF9` | warm stone background |
| `card` / `white` | `#FFFFFF` | surfaces |
| `sand` | `#F5F5F4` | insets / tracks / unselected |
| `line` / `line-strong` | `#E7E5E4` / `#D6D3D1` | hairline borders |
| `ink` / `ink-soft` | `#1C1917` / `#44403C` | text + primary button fill |
| `slate` / `slate-light` | `#78716C` / `#A8A29E` | secondary / tertiary text |
| `indigo` / `indigo-bright` / `indigo-soft` / `indigo-ink` | `#4F46E5` / `#6366F1` / `#EEF2FF` / `#3730A3` | the accent (+ gradient) |
| `positive` / `positive-soft` | `#16A34A` / `#DCFCE7` | "passed" / responded |
| `gold` / `gold-soft` | `#B45309` / `#FEF3C7` | premium / Expert tier (rationed) |
| `danger` / `danger-soft` | `#DC2626` / `#FEE2E2` | errors / dropped |

> Legacy keys (`midnight`, `lime*`, `clay`) are repointed (lime→green, midnight→ink) so old
> references degrade gracefully. `tokens.gradients` are SUBTLE only (accent CTA + glass).

**Typography:** ONE family — **Hanken Grotesk**. Hierarchy via weight/size + tight negative
`letterSpacing` on headings. All Tailwind font keys map to Hanken weights.

**Motion (Reanimated, UI thread):** `spring`/`springSoft` configs in tokens.
- `PressableScale` — spring press-scale (0.97) + light **haptic** (`expo-haptics`); used on cards.
- `PrimaryButton` — spring press + haptic; `accent` = subtle indigo gradient + soft shadow.
- `TabBar` (`src/components/TabBar.tsx`) — custom bar, animated active pill, haptic on switch.
- `PulseDot` — pulsing live indicator. `Motion.tsx` `Entrance`/`stagger` — staggered reveals.
Respect reduced-motion.

**Primitives:** `ui.tsx` → `Card` (soft shadow + hairline, r18), `Chip`, `Divider`, `Eyebrow`.
Icons: `@expo/vector-icons` Feather (`Icon.tsx`). Monochrome monogram `AppLogo`.

**Libraries:** `expo-linear-gradient`, `expo-haptics`, `expo-blur`, `@expo/vector-icons`, Reanimated.

---

## Folder layout

```
mobile/
  app/                    Expo Router routes (see Navigation)
  src/
    api/                  TanStack Query hooks + client
      mock/               fixtures + mock transport (current data source)
    components/           flat dir — CycleCard, CampaignCard, AppLogo, TextField,
                          Countdown, Badge, FeedbackForm, AuthBrand, OnboardingArt …
                          (kept flat: Metro's Windows watcher can miss brand-new subdirs)
    lib/                  auth + onboarding (persisted stores), storage (AsyncStorage),
                          push (expo-notifications), upload (expo-image-picker + R2), queryClient, time
    theme/                token constants for TS usage
    types/                local copy of shared zod schemas / TS types
  assets/                 fonts, icons, splash
  app.json               Expo config
  tailwind.config.js      tokens → NativeWind
  global.css              NativeWind directives
  tsconfig.json           strict
  package.json
```

## Platform: Expo SDK 54

React 19.1 · React Native 0.81.5 · Expo Router 6 · reanimated 4 (+ react-native-worklets) ·
NativeWind 4.1 · TypeScript 5.9. Verified by `tsc --noEmit`, `expo-doctor` (18/18), and a
full `npx expo export` (Hermes bytecode).

**Babel:** reanimated 4 moved the worklets transform — `babel.config.js` uses
`react-native-worklets/plugin` (last in the plugins list). `react-native-reanimated/plugin`
still works as a re-export but the worklets path is canonical.

## Version-compatibility gotchas (don't "fix" these)

1. **Keep every dep aligned to the SDK — run `npx expo install --fix` after any bump.**
   The SDK 51→54 upgrade left `babel-preset-expo@56` (SDK *56*) and `react-native-worklets@0.9.2`
   mismatched against SDK 54 (wants `54.0.x` / `0.5.1`). A babel preset targeting a newer SDK
   emits syntax (private fields, modern classes) that this SDK's **Hermes AOT compiler
   (`hermesc`) can't parse**, so `expo export` fails at the bytecode step with
   "private properties are not supported" / "invalid statement encountered" — even though the
   JS bundle itself is fine. `expo install --fix` resolved it. Do NOT hand-patch babel to
   down-level private fields; that masks the real version drift.
2. **NativeWind `~4.1.23`** (not latest). Verified-good with this stack; 4.2.x would also work
   now that `react-native-worklets` is present, but there's no reason to move off a known-good pin.
3. **Local Hermes export on Windows:** if `hermesc.exe` ever errors on valid syntax, first
   confirm versions are SDK-aligned (gotcha #1). Dev (`expo start`) and EAS cloud builds don't
   use the local win64 hermesc, so they're unaffected by local-only hermesc quirks.

## Conventions

- Screens are thin: they call Query hooks from `src/api/` and render components from `src/components/`.
- All domain types come from `src/types/` (mirror of `@trialcrew/types`; swap to the real package later).
- Native integrations (auth/push/upload) are ALWAYS accessed through `src/lib/` interfaces,
  never imported directly in screens — so the stub→real swap is one file each.
- Keep this file updated as the structure grows.
