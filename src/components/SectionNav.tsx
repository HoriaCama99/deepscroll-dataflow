import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "hero", label: "Top" },
  { id: "datacube", label: "Datacube" },
  { id: "tech", label: "Stack" },
  { id: "clients", label: "Clients" },
  { id: "contact", label: "Contact" },
];

export default function SectionNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 items-end"
      aria-label="Section navigation"
    >
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className="group flex items-center gap-2 p-2.5 -m-2.5 active:scale-95 transition-transform duration-100"
          aria-label={`Go to ${s.label}`}
          aria-current={active === s.id ? "true" : undefined}
        >
          <span
            className={`hidden sm:inline text-[10px] font-mono tracking-wider uppercase transition-opacity duration-200 ${
              active === s.id
                ? "opacity-70"
                : "opacity-0 group-hover:opacity-50"
            }`}
          >
            {s.label}
          </span>
          <span
            className={`block rounded-full transition-all duration-200 ${
              active === s.id
                ? "w-2.5 h-2.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/40 group-hover:bg-muted-foreground/70"
            }`}
          />
        </button>
      ))}
    </nav>
  );
}
