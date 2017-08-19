module.exports = {
  presets: [
    ["env", {
      targets: {
        "browsers": ["last 2 versions", "safari >= 7"],
        "uglify": true,
      },
      // for uglifyjs
      forceAllTransforms: process.NODE_ENV === "production",
      debug: true,
    }],
    ["stage-0"],
  ],
};
