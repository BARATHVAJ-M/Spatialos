module.exports = {
  apps: [
    {
      name: 'spatialos-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: './backend',
      instances: 1, // Change to 'max' for cluster mode if needed
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'spatialos-dashboard',
      script: 'npm',
      args: 'start',
      cwd: './dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
