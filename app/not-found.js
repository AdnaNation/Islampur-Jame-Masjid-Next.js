import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterSkyline from "@/components/FooterSkyline";
import PageBanner from "@/components/PageBanner";

export const metadata = {
  title: "পাতাটি পাওয়া যায়নি",
  robots: { index: false, follow: false },
};

// Shown for any address that does not exist.
export default function NotFound() {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-[#f7f5ef]">
        <PageBanner
          title="৪০৪ - পাতাটি পাওয়া যায়নি"
          subtitle="আপনি যে পাতাটি খুঁজছেন সেটি নেই, অথবা সরিয়ে নেওয়া হয়েছে।"
        />
        <div className="relative z-10 max-w-md px-4 pt-6 pb-10 mx-auto text-center">
          <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
            <p className="text-sm text-slate-600">
              ঠিকানাটি আবার দেখে নিন, অথবা নিচের লিংকগুলো থেকে যেতে পারেন।
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Link
                href="/"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-full bg-[#0f3d2e] hover:bg-[#0c3226]"
              >
                হোম পেজ
              </Link>
              <Link
                href="/notices"
                className="px-5 py-2.5 text-sm font-semibold text-[#0f3d2e] border rounded-full border-[#0f3d2e] hover:bg-slate-50"
              >
                নোটিশ বোর্ড
              </Link>
              <Link
                href="/pay"
                className="px-5 py-2.5 text-sm font-semibold text-[#0f3d2e] border rounded-full border-[#0f3d2e] hover:bg-slate-50"
              >
                চাঁদা পরিশোধ
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FooterSkyline />
      <Footer />
    </div>
  );
}
