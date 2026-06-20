import { useIsFounder } from "@/stores/roleStore";
import { DiscoverScreen } from "@/screens/DiscoverScreen";
import { FounderAppsScreen } from "@/screens/FounderAppsScreen";

/** Tab 1 — role-aware: founder sees their apps, tester sees apps to test. */
export default function Tab1() {
  return useIsFounder() ? <FounderAppsScreen /> : <DiscoverScreen />;
}
