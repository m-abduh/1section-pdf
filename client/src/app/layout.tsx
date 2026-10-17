import type { Metadata } from "next";
import { Providers } from "./providers";
import { themeScript } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "1Section — Practical PDF bundles for every niche",
    template: "%s | 1Section",
  },
  description:
    "Instant-download PDF bundles for finance, business, marketing, and productivity.",
  metadataBase: new URL("https://1section.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
