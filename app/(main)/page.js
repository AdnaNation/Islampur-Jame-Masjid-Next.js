import Link from "next/link";
import Image from "next/image";
import { MdHistory, MdLocationOn, MdPayments } from "react-icons/md";
import PrayerTimes from "@/components/PrayerTimes";
import QuranSection from "@/components/QuranSection";
export const metadata = {
  title: "ইসলামপুর জামে মসজিদ",
  robots: { index: false, follow: false },
};

export default function Home() {
  return (
    <div className="bg-[#f7f5ef]">
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
              ফেনির দাগনভূঞা উপজেলার দুধমুখা বাজারের অদূরে, ইসলামপুর সমাজের
              কেন্দ্রে অবস্থিত।
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
                পেমেন্ট হিস্টোরি
              </Link>
            </div>
          </div>

          <div className="p-2 shadow-2xl rounded-3xl bg-white/10">
            <Image
              src="/mosque.jpg"
              alt="ইসলামপুর জামে মসজিদের প্রবেশদ্বার"
              width={1080}
              height={810}
              priority
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Prayer times + Quran */}
      <div className="max-w-3xl px-4 py-8 mx-auto space-y-6">
        <PrayerTimes />
        <QuranSection />
      </div>
    </div>
  );
}
