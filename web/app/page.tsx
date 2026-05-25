import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import HowItWorks from '@/components/landing/HowItWorks';
import WhoItsFor from '@/components/landing/WhoItsFor';
import PricingTeaser from '@/components/landing/PricingTeaser';
import FooterCTA from '@/components/landing/FooterCTA';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <WhoItsFor />
        <PricingTeaser />
        <FooterCTA />
      </main>
      <Footer />
    </>
  );
}
