import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";

import "./globals.css";

/**
 * Archivo carries the voice: a variable grotesk drawn for signage and
 * high-performance print. Used expanded and heavy it reads like a scoreboard,
 * which is what this product actually is. The `wdth` axis is what makes that
 * possible, so it has to be requested explicitly.
 */
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Mono stays quiet and utilitarian: scores, SHAs, file paths, timers. */
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeJam — Build. Compete. Ship.",
  description:
    "Vibe-coding competitions for you and your friends. Same challenge, same clock, one shared rubric.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${archivo.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
