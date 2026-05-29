import { useState, useEffect } from "react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";

import PricingSection from "@/components/landing/PricingSection";
import RequestDemoSection from "@/components/landing/RequestDemoSection";
import CTASection from "@/components/landing/CTASection";
import SiteFooter from "@/components/landing/SiteFooter";

const Landing = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <AmbulanceLoader />;
  }

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <RequestDemoSection />
      <CTASection />
      <SiteFooter />
    </div>
  );
};

export default Landing;
