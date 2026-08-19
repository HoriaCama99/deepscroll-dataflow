import { useState, useEffect, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import DatacubeSection from "@/components/DatacubeSection";
import TechStackSection from "@/components/TechStackSection";
import ClientSection from "@/components/ClientSection";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";
import SectionNav from "@/components/SectionNav";
import VariantSwitcher from "@/components/VariantSwitcher";
import { PortfolioMidSectionWrapper } from "@/components/PortfolioMidSectionWrapper";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const totalScroll = Math.max(1, docHeight - vh);
    const progress = Math.max(0, Math.min(1, scrollY / totalScroll));
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  return (
    <div className="min-h-screen bg-background">
      <SectionNav />
      <VariantSwitcher />
      <div className="relative" style={{ zIndex: 1 }}>
        <div id="hero"><HeroSection scrollProgress={scrollProgress} /></div>
        <PortfolioMidSectionWrapper>
          <div id="datacube"><DatacubeSection /></div>
          <div id="tech"><TechStackSection /></div>
          <div id="clients"><ClientSection /></div>
        </PortfolioMidSectionWrapper>
        <div id="contact"><ContactSection /></div>
        <FooterSection scrollProgress={scrollProgress} />
      </div>
    </div>
  );
};

export default Index;
