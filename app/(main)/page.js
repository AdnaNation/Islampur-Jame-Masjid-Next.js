import Link from "next/link";
import Image from "next/image";
import Notification from "@/components/Notification";
import { FaKaaba } from "react-icons/fa";
import PrayerTimes from "@/components/PrayerTimes";

export default function Home() {
  return (
    <div>
      <section className="flex items-center h-full sm:p-16 dark:bg-gray-50 dark:text-gray-800 mt-8">
        <PrayerTimes />
      </section>
      <div className="hidden">
        <Notification />
        <div className="mt-16 border rounded-lg ">
          <div className="hero-overlay bg-opacity-60"></div>
          <div className="w-full mx-auto hero-content text-neutral-content">
            <Image
              className="shadow-xl md:max-h-96 w-auto h-auto"
              src="/mosque.jpg"
              alt="mosque"
              width={1200}
              height={800}
            />
          </div>
        </div>

        <div>
          <p className="p-2 text-sm">
            <span className="text-lg font-semibold shadow-lg ">
              ইসলামপুর জামে মসজিদঃ
            </span>{" "}
            ফেনির দাগনভূঞা উপজেলার দুধমুখা বাজারের অদূরে ইসলামপুর সমাজের
            কেন্দ্রে অবস্থিত ইসলামপুর জামে মসজিদ। এটি স্থাপিত করা হয়েছিল ১৯৪০
            সালে।
          </p>
        </div>
      </div>
    </div>
  );
}
