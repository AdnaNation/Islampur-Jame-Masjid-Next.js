import FloatingSocial from "@/components/FloatingSocial";
import "./globals.css";
import Providers from "@/components/Providers";
import { INSTALL_CAPTURE_SCRIPT } from "@/lib/installCapture";

export const metadata = {
  title: "Islampur Jame Masjid",
  description: "Islampur Jame Masjid",
  applicationName: "ইসলামপুর জামে মসজিদ",
  icons: {
    icon: "/logo.jpg",
    apple: "/pwa/icon-192.png",
  },
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
    <html lang="en" data-theme="light">
      <head>
        {/* keeps the browser's one-time "install app" event until the page is ready */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <FloatingSocial />
      </body>
    </html>
  );
}
