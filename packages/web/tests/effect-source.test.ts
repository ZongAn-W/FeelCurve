import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { readEffectSource, resolveEffectSourcePath } from "../lib/effect-source";

const packageRoot = process.cwd();

test("resolves a controlled package-relative source path", async () => {
  const expected = path.join(
    packageRoot,
    "components",
    "effects",
    "MagneticButton.tsx",
  );
  assert.equal(
    resolveEffectSourcePath("components/effects/MagneticButton.tsx"),
    expected,
  );
  await access(expected);
  const source = await readEffectSource("components/effects/MagneticButton.tsx");
  assert.match(source, /export function MagneticButton/);
});

test("rejects path traversal, absolute and out-of-root paths", () => {
  const rejected = [
    "../package.json",
    "../../etc/passwd",
    "/etc/passwd",
    "C:/Windows/win.ini",
    "components/../package.json",
    "components",
    "package.json",
    "effects/MagneticButton.tsx",
  ];
  for (const candidate of rejected) {
    assert.throws(
      () => resolveEffectSourcePath(candidate),
      /Invalid effect sourcePath|escapes components/,
      candidate,
    );
  }
});
