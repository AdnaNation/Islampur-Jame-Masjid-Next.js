import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterSkyline from "@/components/FooterSkyline";

export default function MainLayout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen">{children}</div>
      <div className="print:hidden">
        <FooterSkyline />
        <Footer />
      </div>
    </div>
  );
}
