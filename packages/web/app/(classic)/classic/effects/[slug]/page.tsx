import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { EffectView } from "@/components/classic/detail/EffectView";
import { effectModules, getEffectModule } from "@/content/effects/registry";
import { readEffectSource } from "@/lib/effect-source";
import { SITE_URL } from "@/lib/site-info";

export function generateStaticParams() {
  return effectModules.map((module) => ({ slug: module.spec.slug }));
}

// Unknown slugs are served by the classic 404 instead of a client error shell.
export const dynamicParams = true;

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
    title: `${module.spec.name.zh} · ${module.spec.name.en} — FeelCurve Classic`,
    description: module.spec.description.zh,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/classic/effects/${slug}`,
    },
    openGraph: {
      ...(parentMetadata.openGraph ?? {}),
      url: `${SITE_URL}/classic/effects/${slug}`,
    },
  };
}

export default async function ClassicEffectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = getEffectModule(slug);
  if (!module) notFound();

  const sourceCode = await readEffectSource(module.spec.sourcePath);

  return <EffectView slug={slug} sourceCode={sourceCode} />;
}
