import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Islampur Jame Masjid",
  description: "Islampur Jame Masjid",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
