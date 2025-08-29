module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './server',
      script: 'node',
      args: './dist/index.js',
      instances: 'max',           // scale across CPUs (optional)
      exec_mode: 'cluster',       // cluster mode for Node API
      env_production: {
        NODE_ENV: 'production'
        // other production env vars
      },
      max_memory_restart: '300M',
      watch: false,
      merge_logs: true,
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log'
    }
  ]
};
