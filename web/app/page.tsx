import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import FeatureGrid from '@/components/landing/FeatureGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import WhySilkview from '@/components/landing/WhySilkview';
import PricingTeaser from '@/components/landing/PricingTeaser';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <WhySilkview />
        <PricingTeaser />
      </main>
      <Footer />
    </>
  );
}
