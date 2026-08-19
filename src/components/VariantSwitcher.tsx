import { Link, useLocation } from "react-router-dom";

const VARIANTS = [
  { path: "/", label: "Original" },
  { path: "/console", label: "Console" },
  { path: "/cube", label: "Cube" },
];

export default function VariantSwitcher() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 flex items-center gap-1 rounded-full border border-border bg-card/90 backdrop-blur-md px-1.5 py-1.5 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.35)]"
      aria-label="Design variant switcher"
    >
      {VARIANTS.map((v) => {
        const active = pathname === v.path;
        return (
          <Link
            key={v.path}
            to={v.path}
            aria-current={active ? "page" : undefined}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wide transition-colors duration-200 ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
