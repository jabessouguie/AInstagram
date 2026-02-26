"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";

const BugReportButton = dynamic(
  () => import("@/components/BugReportButton").then((m) => m.BugReportButton),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        {children}
        <BugReportButton />
      </LanguageProvider>
    </ThemeProvider>
  );
}
