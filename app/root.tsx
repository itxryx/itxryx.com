import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { Background } from "./Background";

import "./main.css";

export const loader = async () => {
  return {
    gaTrackingId: process.env.GA_TRACKING_ID,
  };
};

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.png",
    type: "image/png",
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { gaTrackingId } = useRouteLoaderData<typeof loader>("root") ?? {};

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Google tag (gtag.js) */}
        <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId ?? "GA_TRACKING_ID"}`}
        ></script>
        <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaTrackingId ?? "GA_TRACKING_ID"}');
            `,
            }}
        />
      </head>
      <body>
        <Background />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
