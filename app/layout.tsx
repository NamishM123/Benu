import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benu — Dietary Preferences",
  description:
    "Set your dietary preferences and chat with our menu assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
