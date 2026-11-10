import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
};

export default withSentryConfig(nextConfig, {
  // P0 不上传 source map；等配置 SENTRY_AUTH_TOKEN 后再做 P1。
  // 没有 token 时构建也不会失败。
  sourcemaps: { disable: true },
  silent: true,
  telemetry: false,
});
