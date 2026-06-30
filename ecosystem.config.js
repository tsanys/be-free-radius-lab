module.exports = {
  apps: [
    {
      name: "be-free-radius-system",
      script: "dist/cmd/web/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
