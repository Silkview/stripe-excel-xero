import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import UserGuide from '@/components/support/UserGuide';

export const metadata = {
  title: 'Support & user guide | Silkview Connect',
  description:
    'Step-by-step guide for the Silkview Connect Excel add-in — connect Stripe and Xero, pull data, build journals, and push to Xero.',
};

export default function SupportPage() {
  return (
    <>
      <LandingNav />
      <main>
        <UserGuide />
      </main>
      <Footer />
    </>
  );
}
