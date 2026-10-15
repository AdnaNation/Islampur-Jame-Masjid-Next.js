"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp, FaFacebookMessenger, FaUsers } from "react-icons/fa";

// 👉 Put your real links here
const LINKS = {
  // number with country code, no + or spaces
  whatsapp: "https://wa.me/8801789521852",
  // your Facebook page username
  messenger: "https://m.me/islampur.masjid",
  // WhatsApp Community invite link
  community: "https://chat.whatsapp.com/Jaxo7XIK62DIoSw0qaSyVV",
};

// Pages where the buttons should not appear
const HIDE_ON = ["/pay-slip"];

const ITEMS = [
  {
    key: "community",
    href: LINKS.community,
    label: "WhatsApp কমিউনিটি",
    Icon: FaUsers,
    bg: "bg-[#128C7E]",
  },
  {
    key: "whatsapp",
    href: LINKS.whatsapp,
    label: "WhatsApp",
    Icon: FaWhatsapp,
    bg: "bg-[#25D366]",
  },
  {
    key: "messenger",
    href: LINKS.messenger,
    label: "Messenger",
    Icon: FaFacebookMessenger,
    bg: "bg-[#0084FF]",
  },
];

export default function FloatingSocial() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div className="fixed z-40 flex flex-col gap-3 bottom-4 right-4 print:hidden">
      {ITEMS.map(({ key, href, label, Icon, bg }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-110 ${bg}`}
        >
          <Icon className="text-2xl" />
        </a>
      ))}
    </div>
  );
}
