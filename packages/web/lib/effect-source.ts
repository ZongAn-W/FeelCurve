import fs from "node:fs/promises";
import path from "node:path";

/**
 * Source tabs may only read files under this directory. The spec stores a
 * package-relative path (for example `components/effects/MagneticButton.tsx`),
 * so moving a component only requires updating that one path.
 */
export const EFFECT_SOURCE_ROOT = "components";

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/** Normalize a display path without doing any filesystem work. */
export function displaySourcePath(sourcePath: string): string {
  return sourcePath.replace(/\\/g, "/");
}

/**
 * Validate the controlled package-relative path and return a path relative to
 * `components/`. Absolute paths, `..` escapes, Windows drive paths and null
 * bytes are rejected.
 */
export function toComponentRelativePath(
  sourcePath: string,
  packageRoot = process.cwd(),
): string {
  if (
    typeof sourcePath !== "string" ||
    sourcePath.trim().length === 0 ||
    sourcePath.includes("\0")
  ) {
    throw new Error("Invalid effect sourcePath: expected a non-empty path");
  }

  const normalized = displaySourcePath(sourcePath).trim();
  if (
    path.isAbsolute(normalized) ||
    /^[a-zA-Z]:\//.test(normalized) ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new Error(`Invalid effect sourcePath: ${sourcePath}`);
  }

  if (!normalized.startsWith(`${EFFECT_SOURCE_ROOT}/`)) {
    throw new Error(
      `Invalid effect sourcePath: expected a path under ${EFFECT_SOURCE_ROOT}/`,
    );
  }

  const root = path.resolve(packageRoot, EFFECT_SOURCE_ROOT);
  const candidate = path.resolve(root, normalized.slice(EFFECT_SOURCE_ROOT.length + 1));

  if (!isInside(root, candidate)) {
    throw new Error(
      `Effect sourcePath escapes ${EFFECT_SOURCE_ROOT}/: ${sourcePath}`,
    );
  }

  return path.relative(root, candidate);
}

/** Resolve a validated source path to an absolute path (tests, tooling). */
export function resolveEffectSourcePath(
  sourcePath: string,
  packageRoot = process.cwd(),
): string {
  return path.join(
    packageRoot,
    EFFECT_SOURCE_ROOT,
    toComponentRelativePath(sourcePath, packageRoot),
  );
}

/** Read a source tab path after validating it (server-side only). */
export async function readEffectSource(sourcePath: string): Promise<string> {
  const relative = toComponentRelativePath(sourcePath);
  return fs.readFile(
    // The static prefix lets Turbopack scope tracing to components/.
    path.join(process.cwd(), EFFECT_SOURCE_ROOT, relative),
    "utf8",
  );
}
