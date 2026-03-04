import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const CLIENTS = [
  {
    name: "European Space Agency",
    abbr: "ESA",
    desc: "Sentinel constellation data processing and analysis for land monitoring services.",
  },
  {
    name: "European Commission",
    abbr: "EC",
    desc: "Policy-driven geospatial analytics supporting the EU Green Deal targets.",
  },
  {
    name: "Copernicus Programme",
    abbr: "CPNCS",
    desc: "Climate Change Service (C3S) and Land Monitoring (CLMS) data pipelines.",
  },
];

const ClientSection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 font-mono">
            Trusted By
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            Clients & <span className="text-primary text-glow">Programmes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CLIENTS.map((client, i) => (
            <motion.div
              key={client.abbr}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`relative p-8 rounded-lg border cursor-pointer transition-all duration-500 ${
                selected === i
                  ? "border-primary bg-primary/5 border-glow"
                  : "border-border bg-card/30 hover:border-muted-foreground/30"
              }`}
            >
              <div className="font-mono text-3xl font-bold text-muted-foreground/20 mb-4">
                {client.abbr}
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                {client.name}
              </h3>

              <AnimatePresence>
                {selected === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-4">
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                        {client.desc}
                      </p>
                      <div className="mt-4 h-32 rounded bg-secondary/50 flex items-center justify-center border border-border">
                        <span className="text-xs text-muted-foreground font-mono">
                          [ Project Spotlight Map ]
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-4 right-4 text-xs text-muted-foreground font-mono">
                {selected === i ? "[-]" : "[+]"}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientSection;
