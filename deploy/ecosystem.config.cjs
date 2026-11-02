const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "feelcurve-web",
      cwd: path.join(__dirname, "..", "packages", "web"),
      script: path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next"),
      args: ["start", "--hostname", "127.0.0.1", "--port", "3000"],
      interpreter: process.execPath,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: "512M",
      time: true,
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
