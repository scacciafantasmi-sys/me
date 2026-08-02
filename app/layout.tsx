import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLITIS-IT — Simulatore Politico",
  description: "Motore di simulazione politica, economica ed elettorale italiana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
