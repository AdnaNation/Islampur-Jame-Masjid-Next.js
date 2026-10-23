"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MdClose,
  MdDashboard,
  MdHistory,
  MdHome,
  MdLogin,
  MdLogout,
  MdMenu,
  MdVolunteerActivism,
} from "react-icons/md";
import { TbCoinTakaFilled } from "react-icons/tb";
import useAdmin from "@/hooks/useAdmin";
import { getLocalStorage, removeLocalStorage } from "@/lib/localStorage";
import { clearApiCache } from "@/lib/pwa";

const LINKS = [
  { href: "/", label: "হোম", Icon: MdHome },
  { href: "/fee", label: "চাঁদার তালিকা", Icon: TbCoinTakaFilled },
  { href: "/pay", label: "চাঁদা পরিশোধ", Icon: MdVolunteerActivism },
  { href: "/payment", label: "পেমেন্ট হিস্টোরি", Icon: MdHistory },
];
const ADMIN_LINK = {
  href: "/dashboard/home",
  match: "/dashboard", // stays highlighted on every dashboard page
  label: "এডমিন প্যানেল",
  Icon: MdDashboard,
};

const isActive = (pathname, href) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

function DesktopLink({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#0f3d2e] text-white shadow-sm"
          : "text-slate-600 hover:bg-emerald-50 hover:text-[#0f3d2e]"
      }`}
    >
      <Icon className="text-lg" />
      {label}
    </Link>
  );
}

function MobileLink({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
        active
          ? "bg-emerald-50 text-[#0f3d2e]"
          : "text-slate-700 active:bg-slate-100"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl ${
          active ? "bg-[#0f3d2e] text-white" : "bg-slate-100 text-[#0f3d2e]"
        }`}
      >
        <Icon />
      </span>
      {label}
    </Link>
  );
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [userNumber, setUserNumber] = useState(null);
  const [isAdmin] = useAdmin();
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    setUserNumber(getLocalStorage("Number"));
    setOpen(false);
  }, [pathname]);

  // phone menu: close on outside tap or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = () => {
    removeLocalStorage("Number");
    clearApiCache();
    setUserNumber(null);
    setOpen(false);
    router.push("/signin");
  };

  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  const authButton = (full) =>
    userNumber ? (
      <button
        onClick={logout}
        className={`flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 ${
          full ? "w-full" : ""
        }`}
      >
        <MdLogout className="text-lg" /> লগআউট
      </button>
    ) : (
      <Link
        href="/signin"
        className={`flex items-center justify-center gap-2 rounded-full bg-[#0f3d2e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14523d] ${
          full ? "w-full" : ""
        }`}
      >
        <MdLogin className="text-lg" /> লগইন
      </Link>
    );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur print:hidden"
    >
      <div className="flex items-center justify-between h-16 max-w-6xl gap-3 px-3 mx-auto sm:px-4">
        {/* brand */}
        <Link href="/" className="flex items-center min-w-0 gap-2.5">
          <Image
            src="/logo.jpg"
            alt=""
            width={40}
            height={40}
            priority
            className="object-cover w-10 h-10 rounded-full shrink-0 ring-2 ring-emerald-100"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-bold text-[#0f3d2e] sm:text-base">
              ইসলামপুর জামে মসজিদ
            </span>
            <span className="block truncate text-[11px] tracking-wide text-slate-400">
              Islampur Jame Masjid
            </span>
          </span>
        </Link>

        {/* desktop menu */}
        <nav
          className="items-center hidden gap-1 lg:flex"
          aria-label="প্রধান মেনু"
        >
          {links.map((l) => (
            <DesktopLink
              key={l.href}
              {...l}
              active={isActive(pathname, l.match ?? l.href)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">{authButton(false)}</div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            className="flex items-center justify-center text-2xl transition rounded-lg h-10 w-10 text-[#0f3d2e] hover:bg-emerald-50 lg:hidden"
          >
            {open ? <MdClose /> : <MdMenu />}
          </button>
        </div>
      </div>

      {/* phone menu */}
      <div
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full overflow-hidden border-b border-slate-200 bg-white shadow-lg transition-all duration-300 lg:hidden ${
          open
            ? "visible max-h-[32rem] opacity-100"
            : "invisible max-h-0 opacity-0"
        }`}
      >
        <nav className="p-3 space-y-1" aria-label="মোবাইল মেনু">
          {links.map((l) => (
            <MobileLink
              key={l.href}
              {...l}
              active={isActive(pathname, l.match ?? l.href)}
            />
          ))}
          <div className="h-px my-2 bg-slate-100" />
          {authButton(true)}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
