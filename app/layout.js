import FloatingSocial from "@/components/FloatingSocial";
import "./globals.css";
import Providers from "@/components/Providers";
import { INSTALL_CAPTURE_SCRIPT } from "@/lib/installCapture";
import { SITE } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "ইসলামপুর জামে মসজিদ, দুধমুখা, দাগনভূঞা, ফেনী",
    template: "%s | ইসলামপুর জামে মসজিদ",
  },
  description: SITE.shortDescription,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: SITE.url,
    siteName: SITE.name,
    title: "ইসলামপুর জামে মসজিদ, দুধমুখা, দাগনভূঞা, ফেনী",
    description: SITE.shortDescription,
    images: [
      {
        url: "/mosque.jpg",
        width: 1195,
        height: 896,
        alt: "ইসলামপুর জামে মসজিদ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ইসলামপুর জামে মসজিদ, দুধমুখা, দাগনভূঞা, ফেনী",
    description: SITE.shortDescription,
    images: ["/mosque.jpg"],
  },
  icons: { icon: "/logo.jpg", apple: "/pwa/icon-192.png" },
  appleWebApp: {
    capable: true,
    title: "ইসলামপুর মসজিদ",
    statusBarStyle: "default",
  },

  verification: { google: "zqN12cO15bmn1ExFErw6Ol1QqpzQ6TDLLRMAp9SZkWY" },
};

export const viewport = {
  themeColor: "#0f3d2e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <FloatingSocial />
      </body>
    </html>
  );
}
