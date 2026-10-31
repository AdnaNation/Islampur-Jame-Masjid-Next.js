import Link from "next/link";
import { MdHistory, MdLocationOn, MdPayments } from "react-icons/md";
import PrayerTimes from "@/components/PrayerTimes";
import QuranSection from "@/components/QuranSection";
import HeroSlider from "@/components/HeroSlider";
import HeroNoticeLink from "@/components/HeroNoticeLink";
import NoticeBoard from "@/components/NoticeBoard";
import JsonLd from "@/components/JsonLd";
import { OG_BASE, SITE, homeJsonLd, mapsUrl } from "@/lib/site";
import { getNoticeList, getPrayerTimes } from "@/lib/publicData";
import HeroDecor from "@/components/HeroDecor";
import SeasonRibbon from "@/components/SeasonRibbon";
import { skyState } from "@/lib/sky";
import { getSeason } from "@/lib/season";

export const revalidate = 60;
export const metadata = {
  title: {
    absolute: "ইসলামপুর জামে মসজিদ, দাগনভূঞা, ফেনী | নামাজের সময়সূচি",
  },
  description:
    "ইসলামপুর জামে মসজিদ (স্থাপিত ১৯৪০), দুধমুখা বাজার, দাগনভূঞা, ফেনী। আজকের নামাজের সময়সূচি, নোটিশ বোর্ড ও অনলাইনে চাঁদা পরিশোধ। Islampur Jame Masjid, Dagonbhuiyan, Feni.",
  alternates: { canonical: "/" },
  openGraph: {
    ...OG_BASE,
    url: "/",
    title: "ইসলামপুর জামে মসজিদ, দাগনভূঞা, ফেনী | নামাজের সময়সূচি",
    description:
      "আজকের নামাজের সময়সূচি, নোটিশ বোর্ড ও অনলাইনে চাঁদা পরিশোধ - ইসলামপুর জামে মসজিদ, দাগনভূঞা, ফেনী।",
  },
};

export default async function Home() {
  const hijriOffsetDays = -1;
  const seasonOverRide = "";
  const [prayer, notices] = await Promise.all([
    getPrayerTimes().catch(() => undefined),
    getNoticeList(1),
  ]);

  const now = new Date();
  const sky = skyState(prayer?.timings, now);
  const season = getSeason(
    now,
    Number(hijriOffsetDays || 0),
    seasonOverRide || "",
  );

  const HERO_IMAGES = [
    { src: "/mosque.jpg", alt: "ইসলামপুর জামে মসজিদের প্রবেশদ্বার" },
    { src: "/mosque-2.jpg", alt: "মসজিদের ভেতরের দৃশ্য" },
    { src: "/mosque-3.jpg", alt: "মসজিদের সামনের অংশ" },
    { src: "/mosque-4.jpg", alt: "মসজিদের সামনের অংশ" },
  ];
  return (
    <div className="bg-[#f7f5ef]">
      <JsonLd data={homeJsonLd()} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f3d2e] to-[#14523d] text-white">
        <HeroDecor sky={sky} timings={prayer?.timings} season={season} />
        <div className="relative z-10 grid items-center max-w-5xl gap-8 px-4 py-10 mx-auto md:grid-cols-2 md:py-14">
          <div className="text-center md:text-left hd-text">
            <SeasonRibbon season={season} timings={prayer?.timings} />
            <p
              lang="ar"
              dir="rtl"
              className="mb-1 text-center hd-bismillah hd-in md:text-left"
            >
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <span
              className="inline-block px-3 py-1 text-xs font-semibold rounded-full hd-in bg-white/15 text-amber-200"
              style={{ "--d": "0.15s" }}
            >
              স্থাপিত ১৯৪০
            </span>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              ইসলামপুর জামে মসজিদ
            </h1>
            <p lang="en" className="mt-1 text-sm font-medium text-amber-200/90">
              Islampur Jame Masjid
            </p>
            <p className="flex items-center justify-center gap-1 mt-2 text-sm text-white/80 md:justify-start">
              <MdLocationOn className="text-lg text-amber-300" />
              দুধমুখা, দাগনভূঞা, ফেনী
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              ইসলামপুর জামে মসজিদ ১৯৪০ সালে প্রতিষ্ঠিত। ফেনীর দাগনভূঞা উপজেলার
              দুধমুখা বাজারের অদূরে ইসলামপুর সমাজের কেন্দ্রে অবস্থিত এই মসজিদে
              পাঁচ ওয়াক্ত নামাজ, জুমআ ও তারাবীহ জামাআতের সাথে আদায় করা হয়।
            </p>

            <div
              className="flex flex-wrap justify-center gap-3 mt-6 hd-in md:justify-start"
              style={{ "--d": "0.4s" }}
            >
              <Link
                href="/pay"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0f3d2e] bg-white rounded-full shadow hover:bg-amber-50 hd-cta"
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
        <div className="reveal">
          <NoticeBoard initialNotices={notices.length ? notices : undefined} />
        </div>
        <div id="salat" className="reveal scroll-mt-4">
          <PrayerTimes initialData={prayer} />
        </div>
        <div className="reveal">
          <QuranSection />
        </div>

        {/* Plain text for search engines AND visitors: who we are and where we are */}
        <section
          aria-labelledby="about-heading"
          className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200 reveal"
        >
          <h2 id="about-heading" className="text-lg font-bold text-[#0f3d2e]">
            ইসলামপুর জামে মসজিদ সম্পর্কে
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            ইসলামপুর জামে মসজিদ ফেনী জেলার দাগনভূঞা উপজেলার দুধমুখা বাজারের
            অদূরে ইসলামপুর সমাজে অবস্থিত। মসজিদটি ১৯৪০ সালে প্রতিষ্ঠিত। এখানে
            পাঁচ ওয়াক্ত নামাজ, জুমআ ও তারাবীহ জামাআতের সাথে আদায় করা হয়। এই
            ওয়েবসাইটে আপনি নামাজের সময়সূচি, মসজিদের নোটিশ ও ঘোষণা দেখতে এবং
            অনলাইনে মাসিক চাঁদা, তারাবীর চাঁদা ও বকেয়া পরিশোধ করতে পারবেন।
          </p>
          <p lang="en" className="mt-2 text-sm leading-relaxed text-slate-600">
            Islampur Jame Masjid is a mosque near Dudmukha Bazar in Dagonbhuiyan
            Upazila, Feni, Bangladesh, established in 1940. Find daily prayer
            times, mosque notices and pay your monthly donation online.
          </p>
          <address className="mt-3 text-sm not-italic text-slate-700">
            <strong>ঠিকানা:</strong> {SITE.address.street},{" "}
            {SITE.address.locality}, {SITE.address.region}
          </address>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#0f3d2e] hover:underline"
          >
            <MdLocationOn className="text-lg text-amber-600" />
            গুগল ম্যাপে দেখুন
          </a>
        </section>
      </div>
    </div>
  );
}
