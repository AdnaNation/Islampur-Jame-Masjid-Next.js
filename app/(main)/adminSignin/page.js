"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiLock,
  FiPhone,
  FiShield,
} from "react-icons/fi";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useAdmin from "@/hooks/useAdmin";
import { ME_KEY } from "@/hooks/useSession";
import { BtnLoading } from "@/components/Loader";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]/20 disabled:bg-slate-100";

const AdminSignIn = () => {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();
  const router = useRouter();
  const [isAdmin, isAdminLoading] = useAdmin();

  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // already signed in -> no need to see this page
  useEffect(() => {
    if (!isAdminLoading && isAdmin) router.replace("/");
  }, [isAdmin, isAdminLoading, router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await axiosPublic.post("/auth/login", {
        number: number.trim(),
        password,
      });
      await qc.invalidateQueries({ queryKey: ME_KEY });
      router.push("/");
    } catch (err) {
      const status = err?.response?.status;
      setPassword("");
      setError(
        status === 429
          ? "অনেকবার ভুল হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
          : status === 401
            ? "নাম্বার বা পাসওয়ার্ড সঠিক নয়।"
            : "সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-4">
      <div className="w-full max-w-sm">
        {/* header */}
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f3d2e] shadow-md ring-4 ring-[#0f3d2e]/10">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="#c9a24b"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-[#0f3d2e]">অ্যাডমিন লগইন</h1>
          <p className="mt-1 text-sm text-slate-600">ইসলামপুর জামে মসজিদ</p>
        </div>

        {/* card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <form onSubmit={handleSignIn} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
                <p>{error}</p>
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                মোবাইল নাম্বার
              </span>
              <span className="relative block">
                <FiPhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="username"
                  autoFocus
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  disabled={busy}
                  className={inputCls}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                পাসওয়ার্ড
              </span>
              <span className="relative block">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড"
                  disabled={busy}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:text-[#0f3d2e]"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={busy || !number.trim() || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f3d2e] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b2f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f3d2e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <BtnLoading text="যাচাই হচ্ছে..." /> : "লগইন করুন"}
            </button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <FiShield className="text-[#2f7d57]" />
            শুধুমাত্র অ্যাডমিনদের জন্য
          </p>
        </div>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#0f3d2e]"
        >
          <FiArrowLeft /> হোম পেজে ফিরে যান
        </Link>
      </div>
    </main>
  );
};

export default AdminSignIn;
