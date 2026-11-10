"use client";

import { TopBar } from "@/components/site/TopBar";
import { HomeHero } from "@/components/site/HomeHero";
import { TrustBand } from "@/components/site/TrustBand";
import { EffectLibrary } from "@/components/site/EffectLibrary";
import { HandoffSection } from "@/components/site/HandoffSection";
import { FaqSection } from "@/components/site/FaqSection";
import { SiteFooter } from "@/components/site/SiteFooter";

export function HomeView() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        <HomeHero />
        <TrustBand />
        <EffectLibrary />
        <HandoffSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
