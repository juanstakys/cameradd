module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // VisionCamera frame processors use worklets
      "react-native-worklets-core/plugin",
      // Reanimated plugin must be listed last.
      "react-native-reanimated/plugin",
    ],
  };
};
