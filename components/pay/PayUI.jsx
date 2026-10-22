"use client";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiInfo,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BtnLoading, SectionLoader } from "@/components/Loader";
import monthTranslation from "@/lib/monthTranslation";
import { formatMonthRange } from "@/lib/monthRange";

/* ───────────── shared class names ───────────── */

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20 disabled:bg-slate-100 disabled:text-slate-400";

export const btnPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f3d2e] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b2f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f3d2e] disabled:cursor-not-allowed disabled:opacity-50";

export const btnOutline =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#0f3d2e] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f3d2e] transition hover:bg-[#eef3ee]";

export const btnGhost =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700";

/* ───────────── layout ───────────── */

export const Card = ({ className = "", children, ...rest }) => (
  <section
    {...rest}
    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
  >
    {children}
  </section>
);

const STEPS = ["বাছাই", "পেমেন্ট", "জমা"];

/** current: 1 = select, 2 = pay, 4 = all done */
const Stepper = ({ current }) => (
  <ol className="flex items-center justify-center mt-5" aria-label="ধাপ">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <li key={label} className="flex items-center">
          <span className="flex flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-[#2f7d57] text-white"
                  : active
                    ? "bg-[#0f3d2e] text-white ring-4 ring-[#0f3d2e]/15"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <FiCheck /> : n}
            </span>
            <span
              className={`text-[11px] font-medium ${
                active ? "text-[#0f3d2e]" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </span>
          {i < STEPS.length - 1 && (
            <span
              className={`mx-2 mb-4 h-0.5 w-10 rounded sm:w-16 ${
                n < current ? "bg-[#2f7d57]" : "bg-slate-200"
              }`}
            />
          )}
        </li>
      );
    })}
  </ol>
);

/** Page frame with the mosque header. stepNo = 0 hides the stepper. */
export const PayShell = ({ stepNo = 0, children }) => (
  <main className="min-h-screen bg-[#f6f7f4] px-3 py-8 sm:px-6">
    <div className="max-w-xl mx-auto">
      <header className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0f3d2e] shadow-sm">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="#c9a24b"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-[#0f3d2e]">
          Online চাঁদা পরিশোধ
        </h1>
        <p className="mt-1 text-sm text-slate-600">ইসলামপুর জামে মসজিদ</p>
      </header>

      {stepNo > 0 && <Stepper current={stepNo} />}

      <div className="mt-6 space-y-4">{children}</div>
    </div>
  </main>
);

/* ───────────── lookup (only /pay) ───────────── */

const Field = ({ label, right, children }) => (
  <label className="block">
    <span className="flex items-center justify-between mb-1 text-sm font-medium text-slate-700">
      {label}
      {right}
    </span>
    {children}
  </label>
);

export const LookupCard = ({
  homeName,
  selectedHome,
  onHome,
  names,
  selectedNameId,
  onName,
  loadingNames,
  loading,
  notFound,
}) => (
  <Card className="space-y-4">
    <div>
      <h2 className="text-base font-semibold text-[#0f3d2e]">
        আপনার তথ্য বাছাই করুন
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        বাড়ি ও নাম বাছাই করলে আপনার বকেয়া দেখানো হবে।
      </p>
    </div>

    <Field label="বাড়ির নাম">
      <select value={selectedHome} onChange={onHome} className={inputCls}>
        <option value="" disabled>
          বাড়ি বাছাই করুন
        </option>
        {homeName.map((home) => (
          <option key={home} value={home}>
            {home}
          </option>
        ))}
      </select>
    </Field>

    {selectedHome && (
      <Field
        label="নাম"
        right={
          loadingNames && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <span className="inline-block w-3 h-3 border-2 border-current rounded-full animate-spin border-t-transparent" />
              লোড হচ্ছে
            </span>
          )
        }
      >
        <select
          value={selectedNameId}
          onChange={onName}
          disabled={loadingNames}
          className={inputCls}
        >
          <option value="" disabled>
            {loadingNames ? "লোড হচ্ছে..." : "নাম বাছাই করুন"}
          </option>
          {names.map((n) => (
            <option key={n._id} value={n._id}>
              {n.NameBn}
            </option>
          ))}
        </select>
      </Field>
    )}

    {loading && <SectionLoader label="তথ্য লোড হচ্ছে..." className="!py-4" />}
    {notFound && (
      <p className="p-3 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700">
        তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।
      </p>
    )}
  </Card>
);

/* ───────────── member + notices ───────────── */

export const MemberCard = ({ user, onChange }) => (
  <Card className="flex items-center gap-3 border-l-4 !border-l-[#2f7d57]">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3ee] text-xl text-[#0f3d2e]">
      <FiUser />
    </span>
    <div className="flex-1 min-w-0">
      <p className="truncate text-[15px] font-semibold text-[#0f3d2e]">
        {user.NameBn}
      </p>
      <p className="text-xs truncate text-slate-500">{user.HomeName}</p>
    </div>
    {onChange && (
      <button
        type="button"
        onClick={onChange}
        className="text-xs font-semibold text-[#2f7d57] underline underline-offset-2"
      >
        পরিবর্তন
      </button>
    )}
  </Card>
);

export const SmsNotice = ({ hasNumber, masked }) => (
  <div
    className={`flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed ${
      hasNumber
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-amber-200 bg-amber-50 text-amber-800"
    }`}
  >
    <FiInfo className="mt-0.5 shrink-0 text-base" />
    <p>
      {hasNumber
        ? `পেমেন্ট রিসিভ হলে আপনার ${masked} নাম্বারে SMS পাঠানো হবে।`
        : "আমাদের সার্ভারে আপনার নাম্বার নেই। মাসিক আপডেট পেতে দয়া করে আপনার নাম্বারটি আমাদের হোয়াটসঅ্যাপে প্রদান করবেন।"}
    </p>
  </div>
);

/* ───────────── step 1: choose what to pay ───────────── */

const OptionRow = ({ checked, onChange, title, hint, amount }) => (
  <label
    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
      checked
        ? "border-[#0f3d2e] bg-[#eef3ee]"
        : "border-slate-200 bg-white hover:border-[#2f7d57]"
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 accent-[#0f3d2e]"
    />
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold text-slate-800">
        {title}
      </span>
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </span>
    <span className="font-bold tabular-nums text-[#8a6420]">৳{amount}</span>
  </label>
);

export const DuesSelector = ({
  user,
  unpaidMonths,
  selectedMonths,
  onToggleMonth,
  allMonthsSelected,
  onToggleAll,
  payTarabi,
  onTarabi,
  payDueChecked,
  onDue,
  totalAmount,
  onNext,
}) => (
  <>
    {unpaidMonths.length > 0 && (
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0f3d2e]">
              মাসিক চাঁদা
            </h2>
            <p className="text-xs text-slate-500">৳{user.FeeRate} / মাস</p>
          </div>
          <button
            type="button"
            onClick={onToggleAll}
            className="rounded-full border border-[#0f3d2e] px-3 py-1 text-xs font-semibold text-[#0f3d2e] transition hover:bg-[#eef3ee]"
          >
            {allMonthsSelected ? "সব বাতিল করুন" : "সব মাস বাছাই করুন"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {unpaidMonths.map((m) => {
            const on = selectedMonths.includes(m.monthName);
            return (
              <button
                key={m.monthName}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleMonth(m.monthName)}
                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-medium transition ${
                  on
                    ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#2f7d57] hover:bg-[#eef3ee]"
                }`}
              >
                {on && <FiCheck className="text-xs" />}
                {monthTranslation[m.monthName] || m.monthName}
              </button>
            );
          })}
        </div>
      </Card>
    )}

    {(user.Tarabi?.status === "unpaid" || Number(user.Due) > 0) && (
      <div className="space-y-2">
        {user.Tarabi?.status === "unpaid" && (
          <OptionRow
            checked={payTarabi}
            onChange={(e) => onTarabi(e.target.checked)}
            title="তারাবীর চাঁদা"
            amount={user.Tarabi?.fee}
          />
        )}
        {Number(user.Due) > 0 && (
          <OptionRow
            checked={payDueChecked}
            onChange={(e) => onDue(e.target.checked)}
            title="বকেয়া পরিশোধ"
            hint="পূর্বের মোট বকেয়া"
            amount={user.Due}
          />
        )}
      </div>
    )}

    {/* Total + continue: sticks to the bottom on phones */}
    <div className="sticky z-10 p-4 bg-white border shadow-lg bottom-3 rounded-xl border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-600">মোট পরিশোধ</span>
        <span className="text-2xl font-bold tabular-nums text-[#0f3d2e]">
          ৳{totalAmount}
        </span>
      </div>
      <button
        type="button"
        disabled={totalAmount <= 0}
        onClick={onNext}
        className={btnPrimary}
      >
        পরবর্তী ধাপ <FiArrowRight />
      </button>
      {totalAmount <= 0 && (
        <p className="mt-2 text-xs text-center text-slate-500">
          উপর থেকে কমপক্ষে একটি বাছাই করুন
        </p>
      )}
    </div>
  </>
);

/* ───────────── step 2: pay + submit ───────────── */

export const OrderSummary = ({
  months,
  monthlyAmount,
  tarabiAmount,
  payTarabi,
  dueAmount,
  payDue,
  totalAmount,
  rate,
}) => {
  const rows = [];
  if (months.length > 0)
    rows.push([`মাসিক চাঁদা (${formatMonthRange(months)})`, monthlyAmount]);
  if (payTarabi) rows.push(["তারাবীর চাঁদা", tarabiAmount]);
  if (payDue && dueAmount > 0) rows.push(["বকেয়া", dueAmount]);

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-[#0f3d2e]">
        আপনার পরিশোধের তালিকা
      </h2>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, amt]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-semibold tabular-nums text-slate-800">
              ৳{amt}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200">
        <span className="text-sm font-semibold text-slate-700">
          মোট
          {rate > 0 && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              (+ ক্যাশআউট চার্জ {(rate * 100).toLocaleString("bn-BD")}%)
            </span>
          )}
        </span>
        <span className="text-lg font-bold tabular-nums text-[#8a6420]">
          ৳{totalAmount}
        </span>
      </div>
    </Card>
  );
};

export const MethodPicker = ({ methods, method, onChange }) => (
  <div>
    <p className="mb-2 text-sm font-medium text-slate-700">পেমেন্ট মাধ্যম</p>
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(methods).map(([key, m]) => {
        const on = method === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className="flex flex-col items-center gap-1 px-2 py-2.5 text-sm font-semibold transition bg-white border-2 rounded-xl"
            style={
              on
                ? {
                    borderColor: m.color,
                    backgroundColor: `${m.color}12`,
                    color: m.color,
                  }
                : { borderColor: "#e2e8f0", color: "#475569" }
            }
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  </div>
);

const CopyRow = ({ label, value, copied, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5">
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-bold tracking-wide truncate tabular-nums text-[#0f3d2e]">
        {value}
      </p>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        copied
          ? "bg-[#2f7d57] text-white"
          : "bg-[#eef3ee] text-[#0f3d2e] hover:bg-[#dfe9df]"
      }`}
    >
      {copied ? <FiCheck /> : <FiCopy />}
      {copied ? "কপি হয়েছে" : "কপি"}
    </button>
  </div>
);

export const SendMoneyCard = ({
  method,
  methodInfo,
  totalAmount,
  charge,
  totalToSend,
  copiedAmount,
  onCopyAmount,
  copied,
  onCopyTarget,
  mobileNumber,
  bank,
}) => (
  <Card
    className="space-y-3 !border-t-4"
    style={{ borderTopColor: methodInfo.color }}
  >
    {methodInfo.type === "mobile" ? (
      <>
        <p className="text-sm text-slate-600">
          নিচের নাম্বারে{" "}
          <b style={{ color: methodInfo.color }}>{methodInfo.label}</b> অ্যাপ
          থেকে <b>&ldquo;Send Money&rdquo;</b> করুন
        </p>
        <CopyRow
          label="পাঠানোর পরিমাণ"
          value={`৳${totalToSend}`}
          copied={copiedAmount}
          onCopy={onCopyAmount}
        />
        {charge > 0 && (
          <p className="-mt-1 text-xs text-center text-slate-500">
            চাঁদা ৳{totalAmount} + ক্যাশআউট চার্জ ৳{charge}
          </p>
        )}
        <CopyRow
          label={`${methodInfo.label} নাম্বার`}
          value={mobileNumber}
          copied={copied}
          onCopy={onCopyTarget}
        />
      </>
    ) : (
      <>
        <p className="text-sm text-slate-600">
          নিচের ব্যাংক অ্যাকাউন্টে টাকা পাঠান
        </p>
        <CopyRow
          label="পাঠানোর পরিমাণ"
          value={`৳${totalToSend}`}
          copied={copiedAmount}
          onCopy={onCopyAmount}
        />
        <dl className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
          {[
            ["অ্যাকাউন্টের নাম", bank.accountName],
            ["ব্যাংক", bank.bankName],
            ["শাখা", bank.branch],
            bank.routing && ["রাউটিং নম্বর", bank.routing],
          ]
            .filter(Boolean)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold text-right text-slate-800">{v}</dd>
              </div>
            ))}
        </dl>
        <CopyRow
          label="অ্যাকাউন্ট নম্বর"
          value={bank.accountNumber}
          copied={copied}
          onCopy={onCopyTarget}
        />
      </>
    )}
  </Card>
);

export const ClaimForm = ({
  isBank,
  methodLabel,
  senderNumber,
  onSender,
  trxID,
  onTrx,
  onSubmit,
  submitting,
  onBack,
}) => (
  <Card>
    <div className="flex items-start gap-2 p-3 mb-4 text-xs leading-relaxed rounded-lg bg-slate-50 text-slate-600">
      <FiInfo className="mt-0.5 shrink-0 text-base text-[#2f7d57]" />
      <p>
        {isBank
          ? "টাকা পাঠানোর পর ব্যাংক থেকে পাওয়া Transaction ID / Reference নম্বর নিচে লিখুন। "
          : `টাকা পাঠানোর পর আপনার ${methodLabel} অ্যাপে দেখানো Transaction ID (TrxID) নিচে লিখুন। `}
        অ্যাডমিন যাচাই করার পর আপনার চাঁদা আপডেট হবে।
      </p>
    </div>

    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label={
          isBank
            ? "যে অ্যাকাউন্ট/নাম্বার থেকে টাকা পাঠিয়েছেন"
            : "যে নাম্বার থেকে টাকা পাঠিয়েছেন"
        }
      >
        <input
          type="text"
          required
          value={senderNumber}
          onChange={(e) => onSender(e.target.value)}
          placeholder={
            isBank ? "অ্যাকাউন্ট নাম্বার বা ব্যাংকের নাম" : "যেমনঃ 017XXXXXXXX"
          }
          className={inputCls}
        />
      </Field>
      <Field
        label={
          isBank ? "Transaction ID / Reference নম্বর" : "Transaction ID (TrxID)"
        }
      >
        <input
          type="text"
          required
          value={trxID}
          onChange={(e) => onTrx(e.target.value)}
          placeholder="যেমনঃ 9G7H3K2L1M"
          className={`${inputCls} uppercase`}
        />
      </Field>

      <button type="submit" disabled={submitting} className={btnPrimary}>
        {submitting ? (
          <BtnLoading text="পাঠানো হচ্ছে..." />
        ) : (
          "যাচাইয়ের জন্য জমা দিন"
        )}
      </button>
      <button type="button" onClick={onBack} className={btnGhost}>
        <FiArrowLeft /> পিছনে যান
      </button>
    </form>
  </Card>
);

export const HelpLink = ({ href }) => (
  <p className="text-xs text-center text-slate-500">
    পেমেন্ট নিয়ে কোনো সমস্যা হলে{" "}
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-[#1ea952] underline underline-offset-2"
    >
      <FaWhatsapp /> WhatsApp এ যোগাযোগ করুন
    </a>
  </p>
);

/* ───────────── result screens ───────────── */

export const StatusCard = ({ tone = "success", title, text, children }) => (
  <Card className="py-8 space-y-3 text-center">
    <span
      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl ${
        tone === "success"
          ? "bg-emerald-50 text-[#2f7d57]"
          : "bg-rose-50 text-rose-500"
      }`}
    >
      {tone === "success" ? <FiCheckCircle /> : <FiXCircle />}
    </span>
    <h2 className="text-lg font-bold text-[#0f3d2e]">{title}</h2>
    {text && <p className="text-sm text-slate-500">{text}</p>}
    {children}
  </Card>
);
