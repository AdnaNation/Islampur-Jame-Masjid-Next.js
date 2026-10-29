import { MdAttachFile, MdDownload, MdPictureAsPdf } from "react-icons/md";

const size = (n) =>
  n >= 1048576
    ? `${(n / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export default function NoticeAttachmentList({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <section
      aria-label="সংযুক্ত ফাইল"
      className="max-w-3xl mx-auto mt-6 space-y-4 print:hidden"
    >
      <h2 className="flex items-center gap-1 font-bold text-[#0f3d2e]">
        <MdAttachFile className="text-xl text-amber-600" />
        সংযুক্ত ফাইল
      </h2>

      {attachments.map((a) => {
        const href = `/api/notices/files/${a.id}`;
        const isPdf = a.type === "application/pdf";
        return (
          <div
            key={a.id}
            className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200"
          >
            {!isPdf && (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={href}
                  alt={a.name}
                  loading="lazy"
                  className="block w-full h-auto"
                />
              </a>
            )}
            <div className="flex items-center gap-3 p-3">
              {isPdf && (
                <span className="flex items-center justify-center w-10 h-10 text-2xl rounded text-rose-600 bg-rose-50">
                  <MdPictureAsPdf />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.name}</p>
                <p className="text-xs text-slate-500">{size(a.size)}</p>
              </div>
              <a
                href={href}
                download={a.name}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white rounded-lg bg-[#0f3d2e] hover:bg-[#0c3226]"
              >
                <MdDownload /> ডাউনলোড
              </a>
            </div>
          </div>
        );
      })}
    </section>
  );
}
