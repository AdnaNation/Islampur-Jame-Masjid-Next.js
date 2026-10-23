export const metadata = { title: "ইন্টারনেট নেই" };

const links = [
  ["/", "হোম"],
  ["/fee", "চাঁদার তালিকা"],
  ["/payment", "পেমেন্ট হিস্টোরি"],
  ["/dashboard/accounts", "আয়-ব্যয়ের হিসাব"],
];

export default function OfflinePage() {
  return (
    <main className="flex items-center justify-center min-h-screen p-6 bg-orange-50">
      <div className="w-full max-w-sm p-8 text-center bg-white shadow-lg rounded-2xl">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-3xl rounded-full bg-amber-100">
          📴
        </div>
        <h1 className="text-xl font-bold text-[#0f3d2e]">ইন্টারনেট নেই</h1>
        <p className="mt-2 text-sm text-slate-500">
          এই পাতাটি আগে খোলা হয়নি, তাই অফলাইনে দেখানো যাচ্ছে না। ইন্টারনেট এলে
          আবার চেষ্টা করুন। আগে খোলা পাতাগুলো অফলাইনেও দেখা যাবে।
        </p>
        <div className="grid gap-2 mt-5">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-[#0f3d2e]"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
