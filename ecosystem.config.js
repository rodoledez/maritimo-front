// PM2 process config for the production server.
// Used by .github/workflows/deploy.yml — `pm2 reload ecosystem.config.js`.
//
// The script binary `node_modules/next/dist/bin/next` is resolved relative to
// `cwd`, which PM2 sets to the directory containing this file. After deploy,
// that directory is the release folder symlinked as `current`, so the locally
// installed `next` package is found.
//
// Server-only env vars (DB creds, API keys, etc.) come from the `.env` file
// that the deploy script symlinks into the release directory.

module.exports = {
  apps: [
    {
      name: 'maritimo-front',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
