import type { Metadata } from "next";
import { Murecho } from "next/font/google";
import "./globals.css";

const murecho = Murecho({
  variable: "--font-murecho",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "itxryx.com",
  description: "itxryx.com - Web Engineer",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${murecho.variable} h-full antialiased notranslate`}
      translate="no"
    >
      <body className={`${murecho.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
