const FooterSection = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-foreground font-medium">EO Data Science</span>{" "}
            // Senior Earth Observation Scientist
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <span>Copernicus</span>
            <span className="text-border">|</span>
            <span>ESA</span>
            <span className="text-border">|</span>
            <span>European Commission</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
