module.exports = {
  apps: [
    {
      name: 'hr-api',
      script: './apps/api/dist/server.js',
      cwd: '/var/www/hr-system',
      instances: 1, // Use 'max' for cluster mode
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/hr-api-error.log',
      out_file: './logs/hr-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
    },
  ],
};
