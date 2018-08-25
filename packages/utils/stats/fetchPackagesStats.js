const fetch = require('isomorphic-fetch');

export default (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
  return fetch(url).then(response => response.json());
};
