import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EffectView } from "@/components/detail/EffectView";
import { effectModules, getEffectModule } from "@/content/effects/registry";

export function generateStaticParams() {
  return effectModules.map((module) => ({ slug: module.spec.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const module = getEffectModule(slug);
  if (!module) return {};
  return {
    title: `${module.spec.name.zh} · ${module.spec.name.en} — FeelCurve`,
    description: module.spec.description.zh,
  };
}

export default async function EffectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = getEffectModule(slug);
  if (!module) notFound();

  const sourceCode = await fs.readFile(
    path.join(
      process.cwd(),
      "components",
      "effects",
      path.basename(module.spec.sourcePath),
    ),
    "utf8",
  );

  return <EffectView slug={slug} sourceCode={sourceCode} />;
}
