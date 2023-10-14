const isScopedPackageName = require('./isScopedPackageName');

export default  packageName =>
  isScopedPackageName(packageName) || !packageName.includes('/');
