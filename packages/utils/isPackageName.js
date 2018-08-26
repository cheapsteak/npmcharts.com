const isScopedPackageName = require('./isScopedPackageName');

module.exports = packageName =>
  isScopedPackageName(packageName) || !packageName.includes('/');
