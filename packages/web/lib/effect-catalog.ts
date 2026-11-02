import type { EffectModule, EffectSpec } from "@/content/effects/types";

export type EffectGroup = "all" | "buttons" | "text" | "feedback" | "layout";

export const effectGroups: {
  id: EffectGroup;
  label: { zh: string; en: string };
}[] = [
  { id: "all", label: { zh: "全部", en: "All effects" } },
  { id: "buttons", label: { zh: "按钮与开关", en: "Buttons & toggles" } },
  { id: "text", label: { zh: "文字与数字", en: "Text & numbers" } },
  { id: "feedback", label: { zh: "内容与反馈", en: "Content & feedback" } },
  { id: "layout", label: { zh: "卡片与布局", en: "Cards & layout" } },
];

export function getEffectGroup(spec: EffectSpec): Exclude<EffectGroup, "all"> {
  const tags = new Set(spec.tags.map((tag) => tag.toLowerCase()));

  if (["button", "toggle", "hold"].some((tag) => tags.has(tag))) {
    return "buttons";
  }
  if (spec.category === "text") return "text";
  if (["skeleton", "list", "toast"].some((tag) => tags.has(tag))) {
    return "feedback";
  }
  return "layout";
}

export function filterEffectModules(
  modules: readonly EffectModule[],
  query: string,
  group: EffectGroup,
): EffectModule[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return modules.filter(({ spec }) => {
    if (group !== "all" && getEffectGroup(spec) !== group) return false;
    if (terms.length === 0) return true;

    const text = [
      spec.slug,
      spec.name.zh,
      spec.name.en,
      spec.tagline.zh,
      spec.tagline.en,
      spec.description.zh,
      spec.description.en,
      ...spec.tags,
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => text.includes(term));
  });
}
