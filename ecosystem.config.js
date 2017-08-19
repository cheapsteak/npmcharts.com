module.exports = {
  apps : [{
    name        : "npmcharts",
    script      : "npm",
    args        : "start",
    cwd         : "./server",
    watch       : true,
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production"
    },
    instances  : 4,
    exec_mode  : "cluster",
  }],
};
