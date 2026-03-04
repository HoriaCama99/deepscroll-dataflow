import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import DatacubeSection from "@/components/DatacubeSection";
import TechStackSection from "@/components/TechStackSection";
import ClientSection from "@/components/ClientSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background scanline">
      <div className="bg-grid fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <HeroSection scrollProgress={scrollProgress} />
        <DatacubeSection scrollProgress={scrollProgress} />
        <TechStackSection />
        <ClientSection />
        <FooterSection />
      </div>
    </div>
  );
};

export default Index;
