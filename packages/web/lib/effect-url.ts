import {
  defaultParams,
  normalizeParams,
  STACKS,
  VARIANTS,
  type EffectSpec,
  type Params,
  type PromptLang,
  type Stack,
  type Variant,
} from "@/content/effects/types";

export const EFFECT_STATE_KEYS = {
  stack: "stack",
  variant: "variant",
  lang: "lang",
} as const;

export type EffectPageState = {
  params: Params;
  stack: Stack;
  variant: Variant;
  promptLang: PromptLang;
};

function isStack(value: string | null): value is Stack {
  return value !== null && (STACKS as readonly string[]).includes(value);
}

function isVariant(value: string | null): value is Variant {
  return value !== null && (VARIANTS as readonly string[]).includes(value);
}

function isPromptLang(value: string | null): value is PromptLang {
  return value === "zh" || value === "en";
}

function readBoolean(value: string): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function readNumberParam(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Read the shareable detail-page state from a query string.
 *
 * Every value is validated: unknown stacks / variants / languages fall back,
 * invalid numbers or booleans are ignored, and numbers are then clamped and
 * snapped to the spec. The caller owns the URL, so reading never mutates it.
 */
export function readEffectPageState(
  search: string,
  spec: EffectSpec,
  fallbackLang: PromptLang,
): { state: EffectPageState; explicitPromptLang: boolean } {
  const query = new URLSearchParams(search);
  const raw: Params = { ...defaultParams(spec) };

  for (const param of spec.params) {
    const value = query.get(param.key);
    if (value === null) continue;
    if (param.kind === "boolean") {
      const parsed = readBoolean(value);
      if (parsed !== undefined) raw[param.key] = parsed;
      continue;
    }
    const parsed = readNumberParam(value);
    if (parsed !== undefined) raw[param.key] = parsed;
  }

  const rawStack = query.get(EFFECT_STATE_KEYS.stack);
  const rawVariant = query.get(EFFECT_STATE_KEYS.variant);
  const rawLang = query.get(EFFECT_STATE_KEYS.lang);

  return {
    state: {
      params: normalizeParams(spec, raw),
      stack: isStack(rawStack) ? rawStack : "react",
      variant: isVariant(rawVariant) ? rawVariant : "full",
      promptLang: isPromptLang(rawLang) ? rawLang : fallbackLang,
    },
    explicitPromptLang: isPromptLang(rawLang),
  };
}

/**
 * Write the canonical state into an existing query string. Unrelated query
 * parameters are preserved; the caller is responsible for the hash.
 */
export function writeEffectSearch(
  search: string,
  spec: EffectSpec,
  state: EffectPageState,
): string {
  const query = new URLSearchParams(search);
  const params = normalizeParams(spec, state.params);

  for (const param of spec.params) {
    const value = params[param.key];
    query.set(
      param.key,
      param.kind === "boolean" ? (value ? "1" : "0") : String(value),
    );
  }

  const stack = isStack(state.stack) ? state.stack : "react";
  const variant = isVariant(state.variant) ? state.variant : "full";
  const lang = isPromptLang(state.promptLang) ? state.promptLang : "zh";
  query.set(EFFECT_STATE_KEYS.stack, stack);
  query.set(EFFECT_STATE_KEYS.variant, variant);
  query.set(EFFECT_STATE_KEYS.lang, lang);

  return query.toString();
}

/**
 * Build a full URL from a current href (or a path), keeping unrelated query
 * parameters and the hash. `new URL` also means an invalid base cannot expose
 * a partial query string.
 */
export function buildEffectUrl(
  href: string,
  spec: EffectSpec,
  state: EffectPageState,
  base = "http://localhost",
): string {
  const url = new URL(href, base);
  url.search = writeEffectSearch(url.search, spec, state);
  return url.toString();
}

/** Same as {@link buildEffectUrl} but safe for `history.replaceState`. */
export function buildEffectPath(
  href: string,
  spec: EffectSpec,
  state: EffectPageState,
): string {
  const url = new URL(buildEffectUrl(href, spec, state));
  return `${url.pathname}${url.search}${url.hash}`;
}
