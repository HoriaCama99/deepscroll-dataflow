import { useState, useRef, Fragment } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { asset } from "@/lib/utils";

/** Splits on **bold** markers and renders the emphasized spans as <strong>. */
const renderBold = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });

const CLIENTS = [
  {
    name: "European Space Agency",
    abbr: "ESA",
    logo: asset("logos/ESA_logo.png"),
    desc:
      "Re-engineered legacy EO archives into **cloud-optimised Zarr** via parallelized **Dask & Xarray** pipelines — cutting compute time **20%** and storage costs **50%** for the **Digital Twin Earth** initiative. Automated ingestion via **AWS Glue** and applied **TensorFlow/PyTorch** to Sentinel-2/3 anomaly detection.",
    tags: ["Dask", "Xarray", "Zarr", "AWS Glue", "Sentinel-2/3"],
  },
  {
    name: "Joint Research Centre",
    abbr: "JRC",
    logo: asset("logos/JRC_logo_mask.png"),
    desc:
      "Engineered **predictive ML models** for EU environmental impact assessments using **GeoPandas & TensorFlow**, and automated **geostatistical forecasting** via **Apache Airflow**. Built **Plotly/Streamlit** dashboards widening stakeholder access to sustainability insights.",
    tags: ["PySpark", "GeoPandas", "TensorFlow", "Airflow", "Streamlit"],
  },
  {
    name: "EUMETSAT",
    abbr: "EUMETSAT",
    logo: asset("logos/EUMETSAT_logo.svg"),
    desc:
      "Provisioned and maintained **virtual machines** powering climate-data applications for the **Destination Earth (DestinE) Digital Twin**, safeguarding **Earth Observation data integrity** across the **Copernicus** service suite.",
    tags: ["DestinE", "Digital Twin", "Copernicus", "Cloud VMs"],
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
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 font-mono">
            Trusted By
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            Clients & <span className="text-primary">Programmes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {CLIENTS.map((client, i) => (
            <motion.div
              key={client.logo ?? client.abbr}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: i * 0.15 }}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`relative p-8 rounded-lg border cursor-pointer transition-colors duration-200 active:scale-[0.98] ${
                selected === i
                  ? "border-primary bg-primary/5 border-glow"
                  : "border-border bg-card/30 hover:border-muted-foreground/30"
              }`}
            >
              {"logo" in client && client.logo ? (
                <div
                  className="mb-4 text-muted-foreground/20"
                  style={{ height: "3.5rem" }}
                >
                  <div
                    className="h-full w-36 max-w-full bg-current"
                    style={{
                      maskImage: `url(${client.logo})`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "left center",
                      WebkitMaskImage: `url(${client.logo})`,
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "left center",
                    }}
                  />
                </div>
              ) : (
                <div className="font-mono text-3xl font-bold text-muted-foreground/20 mb-4">
                  {client.abbr}
                </div>
              )}
              <h3 className="font-heading font-semibold text-foreground text-lg">
                {client.name}
              </h3>

              <AnimatePresence>
                {selected === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-4">
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                        {renderBold(client.desc)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {client.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono tracking-wide text-primary border border-primary/30 bg-primary/5 rounded px-2 py-1"
                          >
                            {tag}
                          </span>
                        ))}
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
