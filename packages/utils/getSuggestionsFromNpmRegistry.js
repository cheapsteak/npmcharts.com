const fetch = require('isomorphic-fetch');
const _flatMap = require('lodash/flatMap');
const _orderBy = require('lodash/orderBy');
const _toPairs = require('lodash/toPairs');
const _sum = require('lodash/sum');

const getPackage = async packageName => {
  const size = 2;
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
      packageName,
    )}&popularity=1&size=${size}`,
  );
  const json = await response.json();
  return json.objects.find(item => item.package.name === packageName);
};

const getSearchPackagesResultByKeywords = async (keywords, operator) => {
  const size = 8;
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${`keywords:${keywords
      .map(word => `${word}`)
      .join(operator === 'AND' ? '+' : ',')}`}&popularity=1&size=${size}`,
  );
  const json = await response.json();
  return json.objects;
};

module.exports = async packageNames => {
  const searchResults = await Promise.all(packageNames.map(getPackage));
  // packageNames.map(getPackageKeywords).map(x => x.packages);
  const keywords = _flatMap(searchResults, result =>
    result.package.keywords.slice(0, 3),
  );
  if (!keywords) {
    // TODO: figure out how to provide suggestions for packages with no keywords
    return [];
  }
  if (packageNames.length === 1) {
    // assume the first 2 keywords are most important
    const results = (
      await getSearchPackagesResultByKeywords(keywords.slice(0, 2), 'AND')
    ).filter(result => result.package.name !== packageNames[0]);

    return results;
  } else if (packageNames.length > 1) {
    const keywordOccurrences = keywords.reduce(
      (acc, word) => ({
        ...acc,
        [word]: (acc[word] || 0) + 1,
      }),
      {},
    );

    const rankedKeywords = _orderBy(
      _toPairs(keywordOccurrences).map(([word, occurrenceCount]) => {
        const earlyOccurrenceIndex = _sum(
          searchResults.map(result => {
            const index = result.package.keywords.indexOf(word);
            return index === -1 ? 10 : index;
          }),
        );
        return {
          word,
          occurrenceCount,
          earlyOccurrenceIndex,
        };
      }),
      [
        // most frequent occurrence
        ([word, { occurrenceCount }]) => occurrenceCount,

        // earliest occurrence in any package (assuming earlier is more important)
        ([word, { earlyOccurrenceIndex }]) => earlyOccurrenceIndex,
      ],
      ['desc', 'asc'],
    );

    const results = (
      await getSearchPackagesResultByKeywords(
        rankedKeywords.map(([word]) => word).slice(0, 4),
        'AND',
      )
    ).filter(result => !packageNames.includes(result.package.name));

    return results;
  }
};
