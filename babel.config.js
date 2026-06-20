module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated 4 (SDK 54) moved the worklets transform here; it must be last.
      // `react-native-reanimated/plugin` still works as a re-export, but this is canonical.
      "react-native-worklets/plugin",
    ],
  };
};
