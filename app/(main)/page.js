import Link from "next/link";
import { MdHistory, MdLocationOn, MdPayments } from "react-icons/md";
import PrayerTimes from "@/components/PrayerTimes";
import QuranSection from "@/components/QuranSection";
import HeroSlider from "@/components/HeroSlider";
import HeroNoticeLink from "@/components/HeroNoticeLink";
import NoticeBoard from "@/components/NoticeBoard";
export const metadata = {
  title: {
    absolute:
      "ইসলামপুর জামে মসজিদ, দুধমুখা, দাগনভূঞা, ফেনী | নামাজের সময়সূচি ও নোটিশ",
  },
  description:
    "ইসলামপুর জামে মসজিদ (স্থাপিত ১৯৪০), দুধমুখা বাজার, দাগনভূঞা, ফেনী। আজকের নামাজের সময়সূচি, নোটিশ বোর্ড ও অনলাইনে চাঁদা পরিশোধ।",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Mosque",
  name: "ইসলামপুর জামে মসজিদ",
  alternateName: "Islampur Jame Masjid",
  url: "https://www.islampurjamemasjid.org",
  image: "https://www.islampurjamemasjid.org/mosque.jpg",
  foundingDate: "1940",
  address: {
    "@type": "PostalAddress",
    streetAddress: "দুধমুখা বাজার",
    addressLocality: "দাগনভূঞা",
    addressRegion: "ফেনী",
    addressCountry: "BD",
  },
  geo: { "@type": "GeoCoordinates", latitude: 22.893773, longitude: 91.260654 },
};

export default function Home() {
  const HERO_IMAGES = [
    { src: "/mosque.jpg", alt: "ইসলামপুর জামে মসজিদের প্রবেশদ্বার" },
    {
      src: "/mosque-2.jpg",
      alt: "মসজিদের ভেতরের দৃশ্য",
    },
    { src: "/mosque-3.jpg", alt: "মসজিদের সামনের অংশ" },
    { src: "/mosque-4.jpg", alt: "মসজিদের সামনের অংশ" },
  ];
  return (
    <div className="bg-[#f7f5ef]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f3d2e] to-[#14523d] text-white">
        <div className="grid items-center max-w-5xl gap-8 px-4 py-10 mx-auto md:grid-cols-2 md:py-14">
          <div className="text-center md:text-left">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white/15 text-amber-200">
              স্থাপিত ১৯৪০
            </span>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              ইসলামপুর জামে মসজিদ
            </h1>
            <p className="flex items-center justify-center gap-1 mt-2 text-sm text-white/80 md:justify-start">
              <MdLocationOn className="text-lg text-amber-300" />
              দুধমুখা বাজার, দাগনভূঞা, ফেনী
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              ইসলামপুর জামে মসজিদ ১৯৪০ সালে প্রতিষ্ঠিত। ফেনীর দাগনভূঞা উপজেলার
              দুধমুখা বাজারের অদূরে ইসলামপুর সমাজের কেন্দ্রে অবস্থিত এই মসজিদে
              পাঁচ ওয়াক্ত নামাজ, জুমআ ও তারাবীহ জামাআতের সাথে আদায় করা হয়।
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-6 md:justify-start">
              <Link
                href="/pay"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0f3d2e] bg-white rounded-full shadow hover:bg-amber-50"
              >
                <MdPayments className="text-lg" />
                চাঁদা পরিশোধ করুন
              </Link>
              <Link
                href="/payment"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white border rounded-full border-white/40 hover:bg-white/10"
              >
                <MdHistory className="text-lg" />
                পেমেন্ট হিস্ট্রি
              </Link>
              <HeroNoticeLink />
            </div>
          </div>

          <div className="p-2 shadow-2xl rounded-3xl bg-white/10">
            <HeroSlider images={HERO_IMAGES} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl px-4 py-8 mx-auto space-y-6">
        <NoticeBoard />
        <PrayerTimes />
        <QuranSection />
      </div>
    </div>
  );
}
