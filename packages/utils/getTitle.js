import arrayToSentence from 'array-to-sentence';

export const getTitle = packages =>
  packages && packages.length
    ? packages.length === 1
      ? packages[0] + ' download trends - npmcharts 📈'
      : 'Compare npm downloads for ' +
        arrayToSentence(packages) +
        ' - npmcharts 📈'
    : 'Compare download trends of npm packages - npmcharts 📈';
