import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { createMetadata, createStructuredData } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = createMetadata("/");
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};
const structuredData = createStructuredData("/");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <AccessibilityProvider>
              <a className="skip-link" href="#main-content">İçeriğe geç</a>
              <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
              />
              {children}
            </AccessibilityProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
