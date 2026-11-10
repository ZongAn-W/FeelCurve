import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { EffectView } from "@/components/detail/EffectView";
import { effectModules, getEffectModule } from "@/content/effects/registry";
import { readEffectSource } from "@/lib/effect-source";
import { SITE_URL } from "@/lib/site-info";

export function generateStaticParams() {
  return effectModules.map((module) => ({ slug: module.spec.slug }));
}

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ slug: string }>;
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const module = getEffectModule(slug);
  if (!module) return {};
  const parentMetadata = await parent;
  return {
    title: `${module.spec.name.zh} · ${module.spec.name.en} — FeelCurve`,
    description: module.spec.description.zh,
    alternates: {
      canonical: `/effects/${slug}`,
    },
    openGraph: {
      ...(parentMetadata.openGraph ?? {}),
      url: `${SITE_URL}/effects/${slug}`,
    },
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

  // Read the exact package-relative path declared by the spec. The helper
  // rejects absolute paths and any path escaping `components/`.
  const sourceCode = await readEffectSource(module.spec.sourcePath);

  return <EffectView slug={slug} sourceCode={sourceCode} />;
}
