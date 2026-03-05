import type { Metadata } from "next";
import { Open_Sans, Press_Start_2P } from "next/font/google";
import SoundToggle from "@/components/SoundToggle";
import ClickSound from "@/components/ClickSound";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "VegeVisa",
  description: "Testaa tietämyksesi! Pro Vegen visa.",
  metadataBase: new URL("https://vegevisa.vercel.app"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "VegeVisa",
    description: "Testaa tietämyksesi! Pro Vegen visa.",
    siteName: "VegeVisa",
    locale: "fi_FI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VegeVisa",
    description: "Testaa tietämyksesi! Pro Vegen visa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className={`${openSans.variable} ${pressStart.variable} font-sans antialiased pixel-grid`}>
        <SoundToggle />
        <ClickSound />
        <div className="min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
