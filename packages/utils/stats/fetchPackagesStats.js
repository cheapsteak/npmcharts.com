const fetch = require('isomorphic-fetch');

module.exports = (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const baseUrls = ['https://api.npmjs.org/downloads/range', '/api/downloads/range'];

  function fetchStats() {
    const baseUrl = baseUrls.shift();
    if(!baseUrl) {
      throw new Error('Failed to download chart data.');
    }
    const url = `${baseUrl}/${startDate}:${endDate}/${packageNamesParam}`;
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          return fetch(fallbackUrl);
        }
        return response.json();
      })
      .catch(err => {
        console.error(`Failed to download from url=${url}, err: ${err.message}`);
        return fetchStats(baseUrl); // Try next URL
      });
  }

  return fetchStats();

};
