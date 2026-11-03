"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  MdAutorenew,
  MdDelete,
  MdKey,
  MdLockReset,
  MdManageAccounts,
  MdPersonAdd,
  MdVisibility,
  MdVisibilityOff,
  MdWarningAmber,
} from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { CardListSkeleton } from "@/components/Loader";
import { escapeHtml } from "@/lib/escapeHtml";
import { genPassword } from "@/lib/genPassword";
import { MIN_PASSWORD } from "@/lib/adminAccounts";

const ROLE_LABEL = {
  admin: "অ্যাডমিন",
  moderator: "মডারেটর",
  none: "অনুমতি নেই",
};
const ROLE_CLASS = {
  admin: "bg-emerald-100 text-emerald-800",
  moderator: "bg-amber-100 text-amber-800",
  none: "bg-slate-100 text-slate-600",
};
const card = "p-4 bg-white border shadow-sm rounded-xl border-slate-200";
const errText = (e) =>
  e?.response?.data?.message || "সংযোগে সমস্যা হয়েছে, আবার চেষ্টা করুন";

// A password box with a show / hide button
function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  children,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pr-10 input input-bordered"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
          className="absolute -translate-y-1/2 right-2 top-1/2 text-slate-500"
        >
          {show ? (
            <MdVisibilityOff className="text-xl" />
          ) : (
            <MdVisibility className="text-xl" />
          )}
        </button>
      </div>
      {children}
    </div>
  );
}

// shown once after an account is created / reset, with a copy button
const showCredentials = (title, number, password) =>
  Swal.fire({
    icon: "success",
    title,
    html: `<p style="margin-bottom:8px">নাম্বার: <b>${escapeHtml(number)}</b></p>
           <p>পাসওয়ার্ড: <b style="font-family:monospace;font-size:1.1rem">${escapeHtml(password)}</b></p>
           <p style="margin-top:12px;font-size:.85rem;color:#64748b">এই পাসওয়ার্ড আর দেখা যাবে না। কপি করে সংশ্লিষ্ট ব্যক্তিকে নিরাপদে দিন।</p>`,
    confirmButtonText: "কপি করুন",
    showCancelButton: true,
    cancelButtonText: "বন্ধ করুন",
    preConfirm: async () => {
      try {
        await navigator.clipboard.writeText(
          `নাম্বার: ${number}\nপাসওয়ার্ড: ${password}`,
        );
      } catch {}
    },
  });

export default function AdminsPage() {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();

  const { data: people = [], isPending } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => (await axiosPublic.get("/admins")).data,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admins"] });

  /* ───────── my own password ───────── */
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const changeMine = async (e) => {
    e.preventDefault();
    if (nw !== nw2)
      return Swal.fire({
        icon: "warning",
        text: "নতুন পাসওয়ার্ড দুই ঘরে একরকম হয়নি",
      });
    setSavingPw(true);
    try {
      await axiosPublic.post("/auth/change-password", {
        currentPassword: cur,
        newPassword: nw,
      });
      setCur("");
      setNw("");
      setNw2("");
      Swal.fire({
        icon: "success",
        title: "পাসওয়ার্ড বদলানো হয়েছে",
        text: "অন্য সব ডিভাইসে আপনাকে আবার সাইন ইন করতে হবে।",
      });
    } catch (err) {
      Swal.fire({ icon: "error", text: errText(err) });
    } finally {
      setSavingPw(false);
    }
  };

  /* ───────── add a person ───────── */
  const [form, setForm] = useState({
    name: "",
    number: "",
    role: "moderator",
    password: "",
  });
  const [adding, setAdding] = useState(false);
  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await axiosPublic.post("/admins", {
        ...form,
        number: form.number.trim(),
      });
      const done = { ...form };
      setForm({ name: "", number: "", role: "moderator", password: "" });
      refresh();
      showCredentials("যোগ করা হয়েছে", done.number.trim(), done.password);
    } catch (err) {
      Swal.fire({ icon: "error", text: errText(err) });
    } finally {
      setAdding(false);
    }
  };

  /* ───────── actions on one person ───────── */
  const label = (p) => p.name || p.number;

  const changeRole = async (p, role) => {
    const r = await Swal.fire({
      icon: "question",
      title: `${label(p)} কে ${ROLE_LABEL[role]} করবেন?`,
      text: "তিনি সব ডিভাইস থেকে সাইন আউট হয়ে যাবেন।",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, বদলান",
      cancelButtonText: "বাতিল",
    });
    if (!r.isConfirmed) return;
    try {
      await axiosPublic.patch(`/admins/${p.number}`, { role });
      refresh();
    } catch (err) {
      Swal.fire({ icon: "error", text: errText(err) });
      refresh();
    }
  };

  const reset = async (p) => {
    const r = await Swal.fire({
      title: `${label(p)}-এর নতুন পাসওয়ার্ড`,
      input: "text",
      inputValue: genPassword(),
      inputAttributes: { autocomplete: "off" },
      showCancelButton: true,
      confirmButtonText: "রিসেট করুন",
      cancelButtonText: "বাতিল",
      inputValidator: (v) =>
        v && v.length >= MIN_PASSWORD
          ? undefined
          : `কমপক্ষে ${MIN_PASSWORD} অক্ষর দিন`,
    });
    if (!r.isConfirmed) return;
    try {
      await axiosPublic.patch(`/admins/${p.number}`, { password: r.value });
      refresh();
      showCredentials("পাসওয়ার্ড রিসেট হয়েছে", p.number, r.value);
    } catch (err) {
      Swal.fire({ icon: "error", text: errText(err) });
    }
  };

  const remove = async (p) => {
    const r = await Swal.fire({
      icon: "warning",
      title: `${label(p)} কে মুছে ফেলবেন?`,
      text: "তিনি আর সাইন ইন করতে পারবেন না।",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, মুছুন",
      confirmButtonColor: "#e11d48",
      cancelButtonText: "বাতিল",
    });
    if (!r.isConfirmed) return;
    try {
      await axiosPublic.delete(`/admins/${p.number}`);
      refresh();
    } catch (err) {
      Swal.fire({ icon: "error", text: errText(err) });
    }
  };

  const oldPins = people.filter((p) => p.needsReset).length;

  return (
    <div className="max-w-2xl min-h-screen p-4 mx-auto space-y-5">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#0f3d2e]">
        <MdManageAccounts className="text-2xl" /> অ্যাডমিন ও মডারেটর
      </h1>

      {/* my password */}
      <form onSubmit={changeMine} className={`${card} space-y-3`}>
        <h2 className="flex items-center gap-1.5 font-semibold">
          <MdKey className="text-amber-600" /> আমার পাসওয়ার্ড পরিবর্তন
        </h2>
        <PasswordField
          value={cur}
          onChange={setCur}
          placeholder="বর্তমান পাসওয়ার্ড"
          autoComplete="current-password"
        />
        <PasswordField
          value={nw}
          onChange={setNw}
          placeholder={`নতুন পাসওয়ার্ড (কমপক্ষে ${MIN_PASSWORD} অক্ষর)`}
          autoComplete="new-password"
        >
          <button
            type="button"
            onClick={() => {
              const g = genPassword();
              setNw(g);
              setNw2(g);
            }}
            className="h-12 gap-1 btn btn-outline btn-sm"
            title="নিজে থেকে শক্ত পাসওয়ার্ড বানান"
          >
            <MdAutorenew /> বানান
          </button>
        </PasswordField>
        <PasswordField
          value={nw2}
          onChange={setNw2}
          placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={savingPw || !cur || !nw || !nw2}
          className="btn bg-[#0f3d2e] text-white hover:bg-[#0c3226] disabled:opacity-50"
        >
          {savingPw ? "হচ্ছে..." : "পাসওয়ার্ড বদলান"}
        </button>
        <p className="text-xs text-slate-500">
          শুধু সংখ্যা দেওয়া যাবে না। বানানো পাসওয়ার্ড কোথাও লিখে রাখুন - দুই
          ঘরেই বসে যাবে।
        </p>
      </form>

      {/* add */}
      <form onSubmit={add} className={`${card} space-y-3`}>
        <h2 className="flex items-center gap-1.5 font-semibold">
          <MdPersonAdd className="text-emerald-700" /> নতুন অ্যাডমিন / মডারেটর
          যোগ করুন
        </h2>
        <input
          value={form.name}
          onChange={(e) => setF("name")(e.target.value)}
          placeholder="নাম"
          maxLength={60}
          className="w-full input input-bordered"
        />
        <input
          value={form.number}
          onChange={(e) => setF("number")(e.target.value)}
          placeholder="মোবাইল নাম্বার (এটা দিয়েই সাইন ইন করবেন)"
          inputMode="numeric"
          autoComplete="off"
          className="w-full input input-bordered"
        />
        <select
          value={form.role}
          onChange={(e) => setF("role")(e.target.value)}
          className="w-full select select-bordered"
        >
          <option value="moderator">
            মডারেটর - শুধু নামাজের সময় বদলাতে পারবেন
          </option>
          <option value="admin">অ্যাডমিন - সব কাজ করতে পারবেন</option>
        </select>
        <PasswordField
          value={form.password}
          onChange={setF("password")}
          placeholder={`পাসওয়ার্ড (কমপক্ষে ${MIN_PASSWORD} অক্ষর)`}
          autoComplete="new-password"
        >
          <button
            type="button"
            onClick={() => setF("password")(genPassword())}
            className="h-12 gap-1 btn btn-outline btn-sm"
            title="নিজে থেকে শক্ত পাসওয়ার্ড বানান"
          >
            <MdAutorenew /> বানান
          </button>
        </PasswordField>
        <button
          type="submit"
          disabled={
            adding || !form.name.trim() || !form.number.trim() || !form.password
          }
          className="btn bg-[#0f3d2e] text-white hover:bg-[#0c3226] disabled:opacity-50"
        >
          {adding ? "যোগ হচ্ছে..." : "যোগ করুন"}
        </button>
        <p className="text-xs text-slate-500">
          যোগ করার পর পাসওয়ার্ডটি একবারই দেখানো হবে। অ্যাডমিন শুধু অ্যাডমিন
          প্যানেলে ঢুকতে পারেন; মডারেটর মূল সাইটে নামাজের সময় সম্পাদনা করেন।
        </p>
      </form>

      {/* list */}
      <section className="space-y-3">
        <h2 className="font-semibold">বর্তমান তালিকা</h2>

        {oldPins > 0 && (
          <p className="flex items-start gap-2 p-3 text-sm border rounded-lg border-amber-300 bg-amber-50 text-amber-900">
            <MdWarningAmber className="mt-0.5 text-lg shrink-0" />
            {oldPins} জনের পাসওয়ার্ড এখনো পুরনো পিন। নিরাপত্তার জন্য নিচে
            "রিসেট" চেপে নতুন পাসওয়ার্ড দিন।
          </p>
        )}

        {isPending && <CardListSkeleton />}

        {people.map((p) => (
          <div key={p.number} className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 mr-auto">
                <p className="font-semibold truncate">
                  {p.name || "নাম নেই"}
                  {p.isMe && (
                    <span className="ml-2 text-xs font-normal text-emerald-700">
                      (আপনি)
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{p.number}</p>
              </div>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${ROLE_CLASS[p.role]}`}
              >
                {ROLE_LABEL[p.role]}
              </span>
              {p.needsReset && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                  পুরনো পিন
                </span>
              )}
            </div>

            {p.isMe ? (
              <p className="text-xs text-slate-500">
                নিজের পাসওয়ার্ড ওপরের "আমার পাসওয়ার্ড পরিবর্তন" অংশ থেকে
                বদলান।
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={p.role === "none" ? "" : p.role}
                  onChange={(e) => changeRole(p, e.target.value)}
                  className="select select-bordered select-sm"
                  aria-label="ভূমিকা"
                >
                  {p.role === "none" && <option value="">অনুমতি নেই</option>}
                  <option value="admin">অ্যাডমিন</option>
                  <option value="moderator">মডারেটর</option>
                </select>
                <button
                  onClick={() => reset(p)}
                  className="gap-1 btn btn-outline btn-sm"
                >
                  <MdLockReset className="text-lg" /> পাসওয়ার্ড রিসেট
                </button>
                <button
                  onClick={() => remove(p)}
                  className="gap-1 ml-auto btn btn-outline btn-error btn-sm"
                >
                  <MdDelete className="text-lg" /> মুছুন
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
