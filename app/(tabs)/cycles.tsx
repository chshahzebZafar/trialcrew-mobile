import { useIsFounder } from "@/stores/roleStore";
import { MyCyclesScreen } from "@/screens/MyCyclesScreen";
import { FounderTestersScreen } from "@/screens/FounderTestersScreen";

/** Tab 2 — role-aware: founder monitors testers, tester sees their cycles. */
export default function Tab2() {
  return useIsFounder() ? <FounderTestersScreen /> : <MyCyclesScreen />;
}
