import { Hero } from "@/components/landing/hero";
import { JudgedResult } from "@/components/landing/judged-result";
import { ProductLoop } from "@/components/landing/product-loop";
import { SiteHeader } from "@/components/landing/site-header";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-12 px-4 py-12 sm:px-6 lg:gap-14 lg:py-16">
      <SiteHeader />

      <Hero />

      {/* Tight band between two generous ones: the loop is orientation, not
          argument, so it gets the least air on the page. */}
      <section aria-label="How a Jam works">
        <ProductLoop />
      </section>

      <section aria-label="Example results">
        <JudgedResult />
      </section>
    </main>
  );
}
