"use client";

// Lucide-style inline strokes shared by the KDS views. Match the icon set
// used in the design package (kds-shared.jsx) so the visual cues stay
// consistent across V3 lanes and V4 expo.

type SvgProps = React.SVGProps<SVGSVGElement>;

export function PauseIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function FlameIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        d="M13.6 2.5c-.4 2.4 1.1 4 2.4 5.6 1.4 1.6 2.5 3.3 2.5 5.4 0 4-3 6.5-6.5 6.5S5.5 17.6 5.5 13.6c0-1.7.7-3.4 1.9-4.8.6-.7 1.2-1.3 1.6-2.1.3-.6.2-1.3-.1-1.9C10.2 3.7 11.7 2.8 13.6 2.5z"
        opacity=".9"
      />
    </svg>
  );
}

export function CheckIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

export function WarnIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3 2 21h20L12 3z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RotateIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" />
    </svg>
  );
}

export function XIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function ArrowURIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="6" y1="18" x2="18" y2="6" />
      <polyline points="9 6 18 6 18 15" />
    </svg>
  );
}

export function BoltIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export function BellIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
