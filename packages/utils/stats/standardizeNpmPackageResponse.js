export default  response =>
  'package' in response ? [response] : Object.values(response);
