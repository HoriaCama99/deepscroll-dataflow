// Minimal, single-colour (currentColor) reinterpretations of each tool's mark —
// stylized, not literal logo reproductions — sized to sit cleanly at ~28px.

export const SparkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.4 1.6c-1.1 3.1-3.9 4.3-3.9 8 0 2.5 1.9 4.4 4.2 4.4s4.2-1.9 4.2-4.4c0-1.6-.6-2.5-1.1-3.2.1 1.1-.3 1.9-.9 2.4.3-1.5-.5-2.4-.9-3.6-.2 1.4-1.1 2.1-1.1 3.6-.6-.8-1.1-1.6-.5-3.3.4-1.2 1.1-2.1 0-3.9z" />
    <path d="M12.7 15.4c1.9-.3 3.3-1.9 3.3-3.9 0-.4 0-.7-.1-1.1 1 1.1 1.6 2.6 1.6 4.2 0 3.5-2.9 6.4-6.5 6.4S4.5 18.1 4.5 14.6c0-2.4 1.3-4.5 3.3-5.6-.5 1-.8 2.1-.8 3.3 0 3.3 2.5 6 5.7 6.3-.3-1-.3-2.1 0-3.2z" opacity=".55" />
  </svg>
);

export const DaskIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx=".8" />
    <rect x="10.5" y="3.5" width="4.2" height="4.2" rx=".7" opacity=".55" />
    <rect x="16.2" y="2.5" width="5.3" height="5.3" rx=".8" opacity=".8" />
    <rect x="2.5" y="10.5" width="4.2" height="4.2" rx=".7" opacity=".7" />
    <rect x="8.4" y="8.8" width="7" height="7" rx=".9" />
    <rect x="17" y="10.8" width="4.5" height="4.5" rx=".7" opacity=".55" />
    <rect x="3" y="16.4" width="5.6" height="5.6" rx=".8" opacity=".8" />
    <rect x="10.6" y="17.3" width="4.2" height="4.2" rx=".7" opacity=".6" />
    <rect x="16.4" y="16.4" width="5.6" height="5.6" rx=".8" />
  </svg>
);

export const PythonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.9 2.4c-1.7 0-3.4.5-3.4 2.4v2h5.2v.9H6.7C4.9 7.7 3.6 9.3 3.6 12c0 2.6 1.1 4.1 2.9 4.1h1.7v-2.2c0-1.9 1.6-3.1 3.4-3.1h3.6c1.6 0 2.9-1.4 2.9-3V4.8c0-1.6-1.4-2.4-3.4-2.4h-2.8zm-1 1.4a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7z" />
    <path d="M20.4 8v2.1c0 1.9-1.6 3.3-3.4 3.3h-3.6c-1.6 0-2.9 1.3-2.9 2.9v4.9c0 1.6 1.4 2.5 3.4 2.5h2.8c1.7 0 3.4-.5 3.4-2.5v-2h-5.2v-.9h7c1.8 0 2.5-1.5 2.5-4.2 0-2.6-.7-3.6-2.5-3.6h-1.5zm-1 12.2a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7z" opacity=".55" />
  </svg>
);

export const XarrayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <rect x="1.5" y="10.6" width="21" height="2.8" rx="1.4" transform="rotate(-28 12 12)" fill="currentColor" stroke="none" />
    <rect x="1.5" y="10.6" width="21" height="2.8" rx="1.4" transform="rotate(28 12 12)" fill="currentColor" stroke="none" opacity=".55" />
  </svg>
);

export const GdalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className}>
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="4.3" y1="7.2" x2="19.7" y2="7.2" opacity=".6" />
    <line x1="4.3" y1="16.8" x2="19.7" y2="16.8" opacity=".6" />
  </svg>
);

export const PostgresIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="3" fill="currentColor" stroke="none" opacity=".9" />
    <path d="M4.5 5.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    <path d="M4.5 11.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" opacity=".55" />
  </svg>
);
