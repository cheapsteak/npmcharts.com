import * as url from 'url';
import getPackagesFromUrl from './getPackagesFromUrl.js';

export default urlString => {
  const parsedUrl = url.parse(urlString);

  if (!['npmcharts.com', 'localhost'].includes(parsedUrl.hostname)) {
    return false;
  }

  const packages = getPackagesFromUrl(urlString);
  if (!packages.length) {
    return false;
  }

  return true;
};
