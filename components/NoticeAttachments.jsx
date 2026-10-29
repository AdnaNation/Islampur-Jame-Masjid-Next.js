"use client";

import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { MdAttachFile, MdPictureAsPdf } from "react-icons/md";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { BtnLoading } from "@/components/Loader";

const MAX_FILES = 5;
const MAX_BYTES = 4 * 1024 * 1024; // the server enforces the same limit
const okName = (n) => /\.(png|jpe?g|pdf)$/i.test(n);

export const fileSize = (n) =>
  n >= 1048576
    ? `${(n / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export default function NoticeAttachments({ attachments, onChange }) {
  const axiosPublic = useAxiosPublic();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const warn = (text) => Swal.fire({ icon: "warning", text });

  async function pick(e) {
    const files = [...(e.target.files || [])];
    e.target.value = ""; // allows choosing the same file again
    if (!files.length) return;

    setBusy(true);
    let list = attachments;
    try {
      for (const f of files) {
        if (list.length >= MAX_FILES) {
          warn(`সর্বোচ্চ ${MAX_FILES}টি ফাইল যুক্ত করা যায়`);
          break;
        }
        if (!okName(f.name)) {
          warn(`${f.name}: শুধু PDF, JPG বা PNG দেওয়া যাবে`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          warn(`${f.name}: ফাইল ৪ MB-এর বেশি (JPG বেছে নিলে ছোট হয়)`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", f);
        try {
          const { data } = await axiosPublic.post("/notices/files", fd);
          list = [...list, data];
          onChange(list);
        } catch (err) {
          Swal.fire({
            icon: "error",
            text:
              err?.response?.data?.message ||
              "আপলোড হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-3 space-y-2 border rounded-xl border-slate-200 bg-slate-50/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#0f3d2e]">
            সংযুক্ত ফাইল (ঐচ্ছিক)
          </p>
          <p className="text-xs text-slate-500">
            আয়-ব্যয়ের পেজ থেকে নামানো PDF / JPG / PNG এখানে দিন (প্রতিটি ৪ MB
            পর্যন্ত, সর্বোচ্চ {MAX_FILES}টি)। নোটিশ প্রকাশ হলে ফাইল সবাই দেখতে ও
            নামাতে পারবে।
          </p>
        </div>
        <button
          type="button"
          disabled={busy || attachments.length >= MAX_FILES}
          onClick={() => input.current?.click()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#0f3d2e] text-[#0f3d2e] bg-white hover:bg-slate-50 disabled:opacity-40"
        >
          {busy ? <BtnLoading text="আপলোড হচ্ছে" /> : "+ ফাইল যুক্ত করুন"}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          onChange={pick}
          className="hidden"
        />
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 p-2 bg-white border rounded-lg border-slate-200"
            >
              {a.type === "application/pdf" ? (
                <span className="flex items-center justify-center w-12 h-12 text-2xl rounded text-rose-600 bg-rose-50">
                  <MdPictureAsPdf />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/notices/files/${a.id}`}
                  alt=""
                  className="object-cover w-12 h-12 rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  <MdAttachFile className="inline -mt-0.5 text-slate-400" />{" "}
                  {a.name}
                </p>
                <p className="text-xs text-slate-500">{fileSize(a.size)}</p>
              </div>
              <a
                href={`/api/notices/files/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline text-slate-600"
              >
                দেখুন
              </a>
              <button
                type="button"
                onClick={() =>
                  onChange(attachments.filter((x) => x.id !== a.id))
                }
                className="text-sm underline text-rose-600"
              >
                বাদ দিন
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
