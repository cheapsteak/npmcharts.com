const getTitle = require('./getTitle');
const getPackagesFromUrl = require('./getPackagesFromUrl');
const getMinimalUrl = require('./getMinimalUrl');

module.exports = ({ url, width, height }) => {
  const packages = getPackagesFromUrl(url);
  const embedUrl = getMinimalUrl(url);
  return {
    type: 'rich',
    version: '1.0',
    provider_name: 'npmcharts',
    provider_url: 'https://npmcharts.com',
    title: getTitle(packages),
    width: width,
    height: height,
    packages: packages,
    html: `<iframe
          style="width: 100%; overflow: hidden;"
          src="${embedUrl}"
          width="${width}"
          height="${height}"
          frameborder="0"
          scrolling="no"
      ></iframe>`.replace(/\s\s+/g, ' '),
  };
};
