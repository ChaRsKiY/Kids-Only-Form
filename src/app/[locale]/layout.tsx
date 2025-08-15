import type { Metadata } from "next";
import "../globals.css";
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Kids Only - Newsletter Subscription",
  description: "Kids Only - Newsletter Subscription",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kids Only",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Kids Only",
    "mobile-web-app-capable": "yes",
    "application-name": "Kids Only",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
      <html lang={locale}>
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Kids Only" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Kids Only" />
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="theme-color" content="#000000" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/Kids Only Logo.svg" />
        </head>
        <body>
          <NextIntlClientProvider>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
  );
}
