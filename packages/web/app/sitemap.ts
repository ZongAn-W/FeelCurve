import type { MetadataRoute } from "next";

import { liveModules } from "@/content/effects/registry";
import { SITE_URL } from "@/lib/site-info";

// 构建时确定，避免每次请求或每次条目生成不同时间。
const BUILD_TIME = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: BUILD_TIME,
    },
    ...liveModules.map((module) => ({
      url: `${SITE_URL}/effects/${module.spec.slug}`,
      lastModified: BUILD_TIME,
    })),
  ];
}
