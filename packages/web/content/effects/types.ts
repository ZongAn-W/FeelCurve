import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n";

export type { Locale };

export type Localized = Record<Locale, string>;

export type Stack = "react" | "vanilla" | "gsap" | "vue";
export type Variant = "full" | "compact" | "retrofit";
export type PromptLang = Locale;

export const STACKS: Stack[] = ["react", "vanilla", "gsap", "vue"];
export const VARIANTS: Variant[] = ["full", "compact", "retrofit"];

export type NumberParam = {
  kind: "number";
  key: string;
  label: Localized;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type BooleanParam = {
  kind: "boolean";
  key: string;
  label: Localized;
  default: boolean;
};

export type ParamDef = NumberParam | BooleanParam;

export type Params = Record<string, number | boolean>;

export type StackSpec = {
  label: string;
  /** one-line description of the target project used in the prompt */
  context: Localized;
  /** files the AI is allowed to create */
  files: string[];
  deps: string[];
  /** sentence fragment after "Dependencies:" */
  depsNote: Localized;
  /** implementation notes injected into the full / retrofit prompt */
  notes: Record<Locale, string[]>;
};

export type VerifyInfo = {
  status: "pending" | "verified";
  tools?: string[];
  date?: string;
  note?: Localized;
};

export type SpecRow = { label: string; value: string; mono?: boolean };

export type EffectSpec = {
  slug: string;
  status: "live" | "building";
  category: "pointer" | "scroll" | "text" | "layout";
  name: Localized;
  tagline: Localized;
  description: Localized;
  tags: string[];
  params: ParamDef[];
  stacks: Record<Stack, StackSpec>;
  /** the real demo file, read at build time for the "source" tab */
  sourcePath: string;
  verified: VerifyInfo;
  /** shown in the detail page and used verbatim as the prompt acceptance list */
  checklist: Record<Locale, string[]>;
  /** smaller params used for the home card preview */
  previewParams?: Params;
  /** visual scale applied to the demo inside the home card */
  previewScale?: number;
  /** fixed layout width for the demo inside the home card (before previewScale) */
  previewWidth?: number;
  /** extra rows shown in the technical spec card */
  extraRows?: (params: Params, locale: Locale) => SpecRow[];
};

export type PromptArgs = {
  params: Params;
  stack: Stack;
  variant: Variant;
  lang: PromptLang;
  /**
   * The user's existing component for the retrofit variant. It stays in page
   * memory: never serialized into the URL, storage or batch exports.
   */
  existingSource?: string;
};

export type EffectModule = {
  spec: EffectSpec;
  buildPrompt: (args: PromptArgs) => string;
  Demo: ComponentType<{ params: Params; locale: Locale }>;
};

export function readNumber(
  params: Params,
  key: string,
  fallback: number,
): number {
  const value = params[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readBool(
  params: Params,
  key: string,
  fallback: boolean,
): boolean {
  const value = params[key];
  return typeof value === "boolean" ? value : fallback;
}

export function formatNumber(value: number, decimals = 2): string {
  return Number(value.toFixed(decimals)).toString();
}

export function defaultParams(spec: EffectSpec): Params {
  const entries = spec.params.map((param) => [param.key, param.default]);
  return Object.fromEntries(entries) as Params;
}

/** clamp to range and snap to step, so URL params can never break a demo */
export function normalizeParams(spec: EffectSpec, raw: Params): Params {
  const next: Params = {};
  for (const param of spec.params) {
    const value = raw[param.key];
    if (param.kind === "boolean") {
      next[param.key] = typeof value === "boolean" ? value : param.default;
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      next[param.key] = param.default;
      continue;
    }
    const steps = Math.round((value - param.min) / param.step);
    const snapped = param.min + steps * param.step;
    const clamped = Math.min(Math.max(snapped, param.min), param.max);
    next[param.key] = Number(clamped.toFixed(4));
  }
  return next;
}

export function paramDisplay(param: ParamDef, params: Params): string {
  if (param.kind === "boolean") {
    return params[param.key] ? "on" : "off";
  }
  const value = readNumber(params, param.key, param.default);
  return formatNumber(value, param.step < 0.01 ? 3 : param.step < 1 ? 2 : 0);
}
