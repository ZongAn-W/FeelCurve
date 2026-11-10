import * as Sentry from "@sentry/nextjs";

import { SENTRY_DSN } from "./lib/telemetry";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  // SDK v11 用 dataCollection 取代 sendDefaultPii；关闭默认用户信息与请求体采集。
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  tracesSampleRate: 0.1,
  // P0 不开启 Session Replay。
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
