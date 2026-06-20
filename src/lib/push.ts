/**
 * Notifications — REAL wiring (expo-notifications), Expo-Go-safe.
 *
 * `expo-notifications` runs a remote-push auto-registration side-effect on import that
 * throws in Expo Go (SDK 53+ dropped remote Android push). So we **lazy-require** it only
 * when a notification action actually runs, and skip the remote-token path in Expo Go
 * entirely. The meaningful, server-free feature — LOCAL repeating daily check-in reminders —
 * still works in Expo Go. Remote tokens (for the future backend) work in a dev/EAS build.
 *
 * Screens must only import from this module.
 */
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

type Notifications = typeof import("expo-notifications");

const CHANNEL_ID = "daily-checkin";
let handlerSet = false;

const isExpoGo = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Lazy-load the native module + set the foreground handler once. */
function load(): Notifications {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const N: Notifications = require("expo-notifications");
  if (!handlerSet) {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  }
  return N;
}

async function ensureChannel(N: Notifications) {
  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Daily check-ins",
      importance: N.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
    });
  }
}

async function ensurePermission(N: Notifications): Promise<boolean> {
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

/** Best-effort remote push token (future backend). No-op in Expo Go; never throws. */
export async function registerPushToken(): Promise<string | null> {
  if (isExpoGo()) return null; // skip remote entirely in Expo Go
  try {
    const Device = require("expo-device") as typeof import("expo-device");
    if (!Device.isDevice) return null;
    const N = load();
    if (!(await ensurePermission(N))) return null;
    await ensureChannel(N);
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (__DEV__) console.log("[push] expo token:", token.data);
    return token.data;
  } catch (e) {
    if (__DEV__) console.log("[push] token registration skipped:", String(e));
    return null;
  }
}

/** Schedule the repeating daily check-in reminder (local — works in Expo Go). */
export async function scheduleDailyCheckInReminder(hour: number, minute: number): Promise<boolean> {
  try {
    const N = load();
    if (!(await ensurePermission(N))) return false;
    await ensureChannel(N);
    await N.cancelAllScheduledNotificationsAsync();
    await N.scheduleNotificationAsync({
      content: {
        title: "TrialCrew · daily check-in",
        body: "Open the app you're testing and confirm today's check-in to keep your streak.",
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch (e) {
    if (__DEV__) console.log("[push] schedule failed:", String(e));
    return false;
  }
}

export async function cancelDailyCheckInReminder(): Promise<void> {
  try {
    await load().cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
