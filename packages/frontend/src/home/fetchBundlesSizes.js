async function fetchBundleSize(pkgName) {
  const url = `https://bundlephobia.com/api/size?package=${pkgName}`;
  const resp = await fetch(url);

  if (resp.ok) {
    const data = await resp.json();
    const parse = input => parseFloat(input).toFixed(1);
    const format = input =>
      input > 1048576
        ? `${parse(input / 1048576)} MB`
        : input > 1024
        ? `${parse(input / 1024)} KB`
        : `${input} B`;

    return {
      gzip: format(data.gzip),
      size: format(data.size),
    };
  }
}

export const fetchBundlesSizes = pkgNames => {
  return pkgNames.reduce((acc, pkgName) => {
    fetchBundleSize(pkgName).then(bundle => {
      if (bundle) acc[pkgName] = bundle;
    });
    return acc;
  }, {});
};

export default fetchBundlesSizes;
