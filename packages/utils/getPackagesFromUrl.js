import * as url from 'url';

export default urlString => {
  // pathName does not include query params
  const pathname = url.parse(urlString).pathname;
  if (pathname === '/') {
    return [];
  }
  return (
    pathname
      .replace(/^\/compare\//, '')
      .split(',')
      .filter(x => !!x) || []
  );
};
