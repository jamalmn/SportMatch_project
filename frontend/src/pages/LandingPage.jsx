import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import EventsPreview from '../components/landing/EventsPreview';
import HowItWorks from '../components/landing/HowItWorks';
import SportsGrid from '../components/landing/SportsGrid';
import ValueProps from '../components/landing/ValueProps';
import CTAFinal from '../components/landing/CTAFinal';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <EventsPreview />
      <HowItWorks />
      <SportsGrid />
      <ValueProps />
      <CTAFinal />
      <Footer />
    </div>
  );
}
