import { useEffect } from 'react'
import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import PricingSection from '../components/landing/PricingSection'
import StatsSection from '../components/landing/StatsSection'
import FinalCTASection from '../components/landing/FinalCTASection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('landing-page')
    return () => {
      document.documentElement.classList.remove('landing-page')
    }
  }, [])

  return (
    <div className="min-h-screen bg-ct-bg font-display" style={{ scrollBehavior: 'smooth' }}>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <StatsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
