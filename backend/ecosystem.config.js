module.exports = {
  apps: [
    {
      name: 'autisense-backend',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_staging: {
        NODE_ENV: 'production',
        PORT: 4000,
        instances: 2,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        instances: 'max',
      },
    },
  ],
};
