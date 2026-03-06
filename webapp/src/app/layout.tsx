import type { Metadata } from "next";
import { Playfair_Display, Roboto, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-secondary",
  weight: ["400", "500", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InstaInsights – Analytics Instagram",
    template: "%s | InstaInsights",
  },
  description:
    "Plateforme d'analyse Instagram avancée pour créateurs de contenu et agences. Insights alimentés par l'IA.",
  keywords: ["Instagram", "analytics", "influencer", "agence", "insights", "dashboard"],
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "InstaInsights",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f3d3b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');})}`,
          }}
        />
      </head>
      <body
        className={`${playfair.variable} ${roboto.variable} ${montserrat.variable} font-sans`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
