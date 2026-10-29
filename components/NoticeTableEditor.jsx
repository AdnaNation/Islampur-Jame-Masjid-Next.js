"use client";

import { useState } from "react";
import {
  MAX_COLS,
  MAX_ROWS,
  MAX_TABLES,
  markerFor,
  newTable,
  parsePasted,
} from "@/lib/noticeTable";

const cellCls =
  "w-full min-w-[110px] rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-[#0f3d2e] focus:outline-none";
const smallBtn =
  "px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#0f3d2e] text-[#0f3d2e] bg-white hover:bg-slate-50 disabled:opacity-40";

export default function NoticeTableEditor({
  tables,
  onChange,
  onInsert,
  onRemove,
}) {
  const [pasteFor, setPasteFor] = useState(null);
  const [pasteText, setPasteText] = useState("");

  const update = (i, patch) =>
    onChange(tables.map((t, k) => (k === i ? { ...t, ...patch } : t)));

  const setHead = (i, c, v) =>
    update(i, {
      columns: tables[i].columns.map((x, ci) => (ci === c ? v : x)),
    });
  const setCell = (i, r, c, v) =>
    update(i, {
      rows: tables[i].rows.map((row, ri) =>
        ri === r ? row.map((x, ci) => (ci === c ? v : x)) : row,
      ),
    });
  const addRow = (i) =>
    tables[i].rows.length < MAX_ROWS &&
    update(i, { rows: [...tables[i].rows, tables[i].columns.map(() => "")] });
  const delRow = (i, r) =>
    update(i, { rows: tables[i].rows.filter((_, ri) => ri !== r) });
  const addCol = (i) =>
    tables[i].columns.length < MAX_COLS &&
    update(i, {
      columns: [...tables[i].columns, ""],
      rows: tables[i].rows.map((r) => [...r, ""]),
    });
  const delCol = (i, c) =>
    tables[i].columns.length > 1 &&
    update(i, {
      columns: tables[i].columns.filter((_, ci) => ci !== c),
      rows: tables[i].rows.map((r) => r.filter((_, ci) => ci !== c)),
    });

  const applyPaste = (i) => {
    const parsed = parsePasted(pasteText);
    if (!parsed) return;
    update(i, parsed);
    setPasteFor(null);
    setPasteText("");
  };

  const full = tables.length >= MAX_TABLES;

  return (
    <div className="p-3 space-y-3 border rounded-xl border-slate-200 bg-slate-50/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#0f3d2e]">
            টেবিল / কলাম (ঐচ্ছিক)
          </p>
          <p className="text-xs text-slate-500">
            হিসাব বা তালিকা কলামে দেখাতে চাইলে টেবিল যোগ করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={full}
            onClick={() => onChange([...tables, newTable("basic")])}
            className={smallBtn}
          >
            + সাধারণ টেবিল
          </button>
          <button
            type="button"
            disabled={full}
            onClick={() => onChange([...tables, newTable("income")])}
            className={smallBtn}
          >
            + আয়-ব্যয়ের টেবিল
          </button>
        </div>
      </div>

      {tables.map((t, i) => (
        <div
          key={i}
          className="p-3 space-y-2 bg-white border rounded-lg border-slate-300"
        >
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-[#0f3d2e]">টেবিল {i + 1}</b>
            <input
              value={t.title}
              maxLength={100}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="টেবিলের শিরোনাম (ঐচ্ছিক)"
              className={`${cellCls} flex-1`}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1">
              <thead>
                <tr>
                  {t.columns.map((c, ci) => (
                    <th key={ci} className="align-top">
                      <input
                        value={c}
                        maxLength={60}
                        onChange={(e) => setHead(i, ci, e.target.value)}
                        placeholder={`কলাম ${ci + 1}`}
                        className={`${cellCls} font-bold bg-slate-100`}
                      />
                      {t.columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => delCol(i, ci)}
                          className="mt-0.5 text-[11px] text-rose-600 underline"
                        >
                          কলাম মুছুন
                        </button>
                      )}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((c, ci) => (
                      <td key={ci}>
                        <input
                          value={c}
                          maxLength={200}
                          onChange={(e) => setCell(i, ri, ci, e.target.value)}
                          className={cellCls}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() => delRow(i, ri)}
                        aria-label="সারি মুছুন"
                        className="px-2 text-lg leading-none text-rose-600"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addRow(i)}
              className={smallBtn}
            >
              + সারি
            </button>
            <button
              type="button"
              disabled={t.columns.length >= MAX_COLS}
              onClick={() => addCol(i)}
              className={smallBtn}
            >
              + কলাম
            </button>
            <button
              type="button"
              onClick={() => setPasteFor(pasteFor === i ? null : i)}
              className={smallBtn}
            >
              Excel / Sheets থেকে পেস্ট
            </button>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={t.showTotal}
                onChange={(e) => update(i, { showTotal: e.target.checked })}
                className="w-4 h-4 accent-[#0f3d2e]"
              />
              শেষে মোট দেখান
            </label>
          </div>

          {pasteFor === i && (
            <div className="p-2 space-y-2 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-600">
                Excel বা Google Sheets-এর ঘরগুলো কপি করে এখানে পেস্ট করুন। প্রথম
                লাইন হবে কলামের নাম। (বর্তমান টেবিলের তথ্য বদলে যাবে)
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                className={`${cellCls} font-mono`}
              />
              <button
                type="button"
                onClick={() => applyPaste(i)}
                disabled={!pasteText.trim()}
                className={smallBtn}
              >
                টেবিলে বসান
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-slate-200">
            <span className="text-slate-500">
              লেখার মধ্যে এই টেবিল বসাতে: <code>{markerFor(i + 1)}</code> (না
              বসালে লেখার শেষে আসবে)
            </span>
            <span className="flex gap-3">
              <button
                type="button"
                onClick={() => onInsert(i)}
                className="font-semibold text-[#0f3d2e] underline"
              >
                কার্সরের জায়গায় বসান
              </button>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="font-semibold underline text-rose-600"
              >
                টেবিল মুছুন
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
