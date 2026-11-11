"use client";

import { TopBar } from "@/components/classic/site/TopBar";
import { HomeHero } from "@/components/classic/site/HomeHero";
import { TrustBand } from "@/components/classic/site/TrustBand";
import { EffectLibrary } from "@/components/classic/site/EffectLibrary";
import { HandoffSection } from "@/components/classic/site/HandoffSection";
import { FaqSection } from "@/components/classic/site/FaqSection";
import { SiteFooter } from "@/components/classic/site/SiteFooter";

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
