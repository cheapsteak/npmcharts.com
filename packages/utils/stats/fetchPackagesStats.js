import fetch from 'isomorphic-fetch';

export default (packageNames, startDate, endDate) => {
  const packageNamesParam = packageNames.join(',');
  const baseApiUrls = ['https://api.npmjs.org', '/api'];

  function fetchStats() {
    const baseUrl = baseApiUrls.shift();
    if (!baseUrl) {
      console.error(`Failed to fetch package stats for "${packageNames}"`);
      return null;
    }
    const url = `${baseUrl}/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          console.warn(
            `Unexpected HTTP response from url=${url}: status:${response.status}: "${response.statusText}"`,
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
