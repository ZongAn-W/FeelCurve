import assert from "node:assert/strict";
import test from "node:test";
import { trackEvent } from "../lib/analytics";

type TrackProps = Record<string, string | number | boolean>;
type FakeUmami = {
  track: (name: string, props?: TrackProps) => void;
};
type FakeWindow = {
  umami?: FakeUmami;
};

function withFakeWindow(fake: FakeWindow, run: () => void): void {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const previous = (globalThis as { window?: FakeWindow }).window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: fake,
  });

  try {
    run();
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: previous,
      });
    } else {
      delete (globalThis as { window?: FakeWindow }).window;
    }
  }
}

test("trackEvent forwards the event name and properties to Umami", () => {
  const calls: Array<{ name: string; props?: TrackProps }> = [];

  withFakeWindow(
    {
      umami: {
        track: (name, props) => calls.push({ name, props }),
      },
    },
    () => {
      trackEvent("copy_prompt", {
        slug: "magnetic-button",
        surface: "hero",
        stack: "react",
        variant: "full",
        lang: "zh",
      });
    },
  );

  assert.deepEqual(calls, [
    {
      name: "copy_prompt",
      props: {
        slug: "magnetic-button",
        surface: "hero",
        stack: "react",
        variant: "full",
        lang: "zh",
      },
    },
  ]);
});

test("trackEvent silently ignores a missing tracker or a broken tracker", () => {
  withFakeWindow({}, () => {
    assert.doesNotThrow(() => trackEvent("copy_prompt", { slug: "demo" }));
  });

  withFakeWindow(
    {
      umami: {
        track: () => {
          throw new Error("analytics unavailable");
        },
      },
    },
    () => {
      assert.doesNotThrow(() => trackEvent("copy_prompt", { slug: "demo" }));
    },
  );
});

test("trackEvent is safe during server rendering", () => {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const previous = (globalThis as { window?: FakeWindow }).window;

  delete (globalThis as { window?: FakeWindow }).window;

  try {
    assert.doesNotThrow(() =>
      trackEvent("copy_prompt", { slug: "server-rendered" }),
    );
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: previous,
      });
    }
  }
});
