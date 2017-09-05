const arrayToSentence = require('array-to-sentence');

module.exports = (packages) =>
  (packages && packages.length)
    ? 'Compare npm downloads for ' + arrayToSentence(packages) + ' - npmcharts 📈'
    : 'Compare download trends of npm packages - npmcharts 📈'