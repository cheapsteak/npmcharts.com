const fetch = require('isomorphic-fetch');

module.exports = (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const url = `/api/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
  return fetch(url).then(response => response.json());
};
