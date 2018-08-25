module.exports = response =>
  'package' in response ? [response] : Object.values(response);
