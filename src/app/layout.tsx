import type { Metadata } from "next";
import { Murecho } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

if (gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) {
  throw new Error(
    "NEXT_PUBLIC_GA_MEASUREMENT_ID must be a GA4 measurement ID.",
  );
}

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
        {process.env.NODE_ENV === "production" && gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
