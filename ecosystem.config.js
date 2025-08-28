module.exports = {
       apps: [
         {
           name: 'api',
           cwd: './server',
           script: './dist/index.js',
           env: {
             NODE_ENV: 'production',
             // your other env vars or let PM2 inherit from process.env/.env
           }
         },
         {
           name: 'client',
           cwd: './client',
           script: 'npm',
           args: 'run serve',
           env: {
             NODE_ENV: 'production'
           }
         }
       ]
     }