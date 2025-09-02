module.exports = {
  apps: [
    {
      name   : "api",
      cwd    : "./server",
      script : "./dist/index.js",
      env    : {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
}