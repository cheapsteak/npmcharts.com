const fetch = require('isomorphic-fetch');

module.exports = (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const baseApiUrls = ['https://api.npmjs.org', '/api'];

  function fetchStats() {
    const baseUrl = baseApiUrls.shift();
    if (!baseUrl) {
      throw new Error('Failed to download chart data.');
    }
    const url = `${baseUrl}/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          console.warn(
            `Unexpected HTTP response from url=${url}: status:${
              response.status
            }: "${response.statusText}"`,
          );
          return fetchStats(); // Try next URL
        }
        return response.json();
      })
      .catch(err => {
        console.warn(
          `Failed to download from url=${url}, err: "${err.message}"`,
        );
        return fetchStats(); // Try next URL
      });
  }

  return fetchStats();
};
