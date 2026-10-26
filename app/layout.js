import FloatingSocial from "@/components/FloatingSocial";
import "./globals.css";
import Providers from "@/components/Providers";
import { INSTALL_CAPTURE_SCRIPT } from "@/lib/installCapture";

export const metadata = {
  metadataBase: new URL("https://www.islampurjamemasjid.org"),
  title: {
    default: "ইসলামপুর জামে মসজিদ, দুধমুখা, দাগনভূঞা, ফেনী",
    template: "%s | ইসলামপুর জামে মসজিদ",
  },
  description:
    "ইসলামপুর জামে মসজিদ, দুধমুখা বাজার, দাগনভূঞা, ফেনী। নামাজের সময়সূচি, নোটিশ বোর্ড এবং অনলাইনে চাঁদা পরিশোধ।",
  applicationName: "ইসলামপুর জামে মসজিদ",
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "ইসলামপুর জামে মসজিদ",
    images: [
      { url: "/mosque.jpg", alt: "ইসলামপুর জামে মসজিদ" },
      { url: "/mosque-2.jpg", alt: "ইসলামপুর জামে মসজিদ" },
      { url: "/mosque-3.jpg", alt: "ইসলামপুর জামে মসজিদ" },
      { url: "/mosque-4.jpg", alt: "ইসলামপুর জামে মসজিদ" },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/logo.jpg", apple: "/pwa/icon-192.png" },
  appleWebApp: {
    capable: true,
    title: "ইসলামপুর মসজিদ",
    statusBarStyle: "default",
  },
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
