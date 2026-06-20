/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Modern "SaaS-mobile" system: warm stone + electric indigo + green + gold.
        bg: "#FAFAF9",
        paper: "#FAFAF9",
        porcelain: "#FAFAF9",
        card: "#FFFFFF",
        sand: "#F5F5F4",
        white: "#FFFFFF",
        line: "#E7E5E4",
        "line-strong": "#D6D3D1",

        ink: "#1C1917",
        "ink-soft": "#44403C",
        midnight: "#1C1917",
        "midnight-deep": "#0C0A09",
        slate: "#78716C",
        "slate-light": "#A8A29E",

        indigo: "#4F46E5",
        "indigo-bright": "#6366F1",
        "indigo-soft": "#EEF2FF",
        "indigo-ink": "#3730A3",

        positive: "#16A34A",
        "positive-soft": "#DCFCE7",
        lime: "#16A34A",
        "lime-deep": "#15803D",
        "lime-bright": "#22C55E",

        gold: "#B45309",
        "gold-soft": "#FEF3C7",

        danger: "#DC2626",
        "danger-soft": "#FEE2E2",
        clay: "#DC2626",
        "clay-soft": "#FEE2E2",
      },
      fontFamily: {
        display: ["HankenGrotesk_700Bold"],
        "display-x": ["HankenGrotesk_700Bold"],
        "display-sb": ["HankenGrotesk_600SemiBold"],
        sora: ["HankenGrotesk_700Bold"],
        "sora-bold": ["HankenGrotesk_700Bold"],
        body: ["HankenGrotesk_400Regular"],
        "body-medium": ["HankenGrotesk_500Medium"],
        "body-semibold": ["HankenGrotesk_600SemiBold"],
        inter: ["HankenGrotesk_400Regular"],
        "inter-medium": ["HankenGrotesk_500Medium"],
        "inter-semibold": ["HankenGrotesk_600SemiBold"],
        mono: ["HankenGrotesk_500Medium"],
        "mono-bold": ["HankenGrotesk_600SemiBold"],
      },
    },
  },
  plugins: [],
};
