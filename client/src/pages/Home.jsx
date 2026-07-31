import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../components/Hero.jsx';
import Services from '../components/Services.jsx';
import LeadCatcher from '../components/LeadCatcher.jsx';
import Process from '../components/Process.jsx';
import Reviews from '../components/Reviews.jsx';
import CTA from '../components/CTA.jsx';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <LeadCatcher />
        <Process />
        <Reviews />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
