module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": ["OPENAI_API_KEY", "YOUTUBE_API_KEY"],
        "safe": false,
        "allowUndefined": false
      }],
      'react-native-reanimated/plugin'
    ]
  };
}; 