import Image from "next/image";
import { notFound } from "next/navigation";
import { formatMonthRange } from "@/lib/monthRange";
import { getPaySlip } from "@/lib/paySlip";
import SlipActions from "@/components/SlipActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "পেমেন্ট রশিদ | ইসলামপুর জামে মসজিদ",
  robots: { index: false, follow: false },
};

const TYPE_LABEL = {
  Monthly: "মাসিক চাঁদা",
  Tarabi: "তারাবীর চাঁদা",
  Due: "বকেয়া চাঁদা",
};

const METHOD_LABEL = { cash: "ক্যাশ", bkash: "বিকাশ" };

function formatDateTime(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
}

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-right text-slate-800">{children}</dd>
  </div>
);

export default async function PaySlipPage({ params }) {
  const { slipId } = await params;
  const slip = await getPaySlip(slipId);
  if (!slip) notFound();

  const allReverted = slip.items.every((i) => i.reverted);
  const someReverted = slip.items.some((i) => i.reverted);
  const activeTotal = slip.items
    .filter((i) => !i.reverted)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <main className="min-h-screen px-3 py-6 bg-orange-50 print:bg-white print:p-0">
      <article
        id="slip"
        className="max-w-md mx-auto overflow-hidden bg-white shadow-lg rounded-2xl print:shadow-none print:rounded-none"
      >
        <header className="bg-[#0f3d2e]  px-5 py-5 text-center text-white">
          <Image
            src="/logo.jpg"
            alt="ইসলামপুর জামে মসজিদ"
            width={70}
            height={70}
            className="mx-auto mb-2 rounded-full"
          />
          <h1 className="text-xl font-bold">ইসলামপুর জামে মসজিদ</h1>
          <p className="text-xs text-white/70">দক্ষিণ চন্ডিপুর, ইসলামপুর</p>
          <p className="inline-block px-3 py-1 mt-3 text-sm font-semibold rounded-full bg-white/15">
            পেমেন্ট রশিদ
          </p>
        </header>

        <div className="px-5 pt-4">
          <div
            className={`rounded-lg py-2 text-center text-sm font-bold ${
              allReverted
                ? "bg-rose-50 text-rose-600"
                : "bg-[#2f7d57]/10 text-[#2f7d57]"
            }`}
          >
            {allReverted ? "✕ বাতিলকৃত পেমেন্ট" : "✓ পরিশোধিত"}
          </div>

          <dl className="mt-3 divide-y divide-slate-100">
            <Row label="নাম">{slip.name || "-"}</Row>
            <Row label="বাড়ির নাম">{slip.home || "-"}</Row>
            <Row label="তারিখ">{formatDateTime(slip.createdAt)}</Row>
            <Row label="মাধ্যম">
              {METHOD_LABEL[slip.method] || slip.method || "-"}
            </Row>
            {slip.trxID && (
              <Row label="TrxID">
                <span className="font-mono">{slip.trxID}</span>
              </Row>
            )}
            <Row label="রশিদ আইডি">
              <span className="font-mono">{slipId}</span>
            </Row>
          </dl>
        </div>

        <div className="px-5 mt-4">
          <h2 className="pb-1 text-xs font-bold tracking-wide border-b text-slate-500">
            বিবরণ
          </h2>
          <ul>
            {slip.items.map((item, idx) => {
              const months = formatMonthRange(item.months || []);
              return (
                <li
                  key={item.paymentId || idx}
                  className="flex items-start justify-between gap-3 py-3 border-b border-dashed last:border-0"
                >
                  <div className={item.reverted ? "opacity-60" : ""}>
                    <p
                      className={`font-semibold text-slate-800 ${
                        item.reverted ? "line-through" : ""
                      }`}
                    >
                      {TYPE_LABEL[item.type] || item.type}
                    </p>
                    {months && (
                      <p className="text-xs text-slate-500">{months}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-semibold tabular-nums text-slate-800 ${
                        item.reverted ? "line-through opacity-60" : ""
                      }`}
                    >
                      ৳{item.amount}
                    </p>
                    {item.reverted && (
                      <span className="text-[10px] font-semibold text-rose-600">
                        বাতিল
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between py-3 mt-1 border-t-2 border-slate-800">
            <span className="font-bold text-slate-800">
              {someReverted ? "মোট (বাতিল বাদে)" : "মোট"}
            </span>
            <span className="text-xl font-bold tabular-nums text-[#0f3d2e]">
              ৳{activeTotal}
            </span>
          </div>
        </div>

        <footer className="px-5 pb-6 text-center">
          <p className="text-[11px] text-slate-400">
            এটি কম্পিউটার জেনারেটেড রশিদ, স্বাক্ষরের প্রয়োজন নেই।
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            জাযাকুমুল্লাহু খাইরান
          </p>
        </footer>
      </article>
      <SlipActions fileName={`slip-${slipId}`} />
    </main>
  );
}
