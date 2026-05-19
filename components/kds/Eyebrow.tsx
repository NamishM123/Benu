"use client";

export default function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 ${className}`}
    >
      {children}
    </div>
  );
}
