const fetch = require('isomorphic-fetch');

module.exports = (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
  const fallbackUrl = `/api/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
  return fetch(url)
    .then(response => response.json())
    .catch(exception => fetch(fallbackUrl));
};
