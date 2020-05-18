const httpProxy = require('http-proxy');
const psl = require('psl');

const proxy = httpProxy.createProxyServer();

proxy.on('error', function(err, req, res) {
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  console.log(err);
  res.end(err);
});

const subdomainNamespace = `deploys`;
const subdomainRegex = new RegExp(`^(.+)--(.+)\\.${subdomainNamespace}$`);

const getDeploymentRoot = (deploymentType, deploymentId) => {
  if (deploymentType === 'deploy-preview') {
    return `https://npmcharts.storage.googleapis.com/deployments/branches/${deploymentId}`;
  }
};

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

exports.routeSubdomains = (req, res) => {
  const { subdomain } = psl.parse(req.host);
  const subdomainMatches = subdomainRegex.exec(subdomain);
  if (!subdomainMatches) {
    res.status(400).send(JSON.stringify(`invalid subdomain ${subdomain}`));
  }
  const [, deploymentType, deploymentId] = subdomainMatches;
  const path = req.path === '/' ? '/index.html' : req.path;
  const target = `${getDeploymentRoot(deploymentType, deploymentId)}${path}`;

  proxy.web(req, res, {
    target,
    ignorePath: true,
    followRedirects: true,
    secure: false,
    changeOrigin: true,
  });
};
