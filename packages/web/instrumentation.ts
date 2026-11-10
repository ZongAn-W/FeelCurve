import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// 捕获 Server Component、Route Handler、Server Action 和代理中的未处理异常。
export const onRequestError = Sentry.captureRequestError;
