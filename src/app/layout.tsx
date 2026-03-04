import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VegeVisa — Kasvistietovisailu",
  description: "Testaa kasvistietosi! Pro Vegen kasvistietovisailu.",
  openGraph: {
    title: "VegeVisa — Kasvistietovisailu",
    description: "Testaa kasvistietosi! Pro Vegen kasvistietovisailu.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className={`${nunito.variable} ${quicksand.variable} font-sans antialiased`}>
        <div className="min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
