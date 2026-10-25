"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdAccountBalanceWallet,
  MdAdminPanelSettings,
  MdArrowBack,
  MdCampaign,
  MdClose,
  MdForum,
  MdLink,
  MdMenu,
  MdMenuBook,
  MdPayments,
  MdPersonAdd,
  MdSms,
  MdSpaceDashboard,
  MdStorefront,
} from "react-icons/md";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminRoute from "@/components/AdminRoute";

// Add / reorder dashboard pages here (used by the sidebar AND the phone drawer)
const MENU = [
  {
    title: "মূল",
    items: [
      { href: "/dashboard/home", label: "এডমিন হোম", Icon: MdSpaceDashboard },
      {
        href: "/dashboard/payment-requests",
        label: "পেমেন্ট রিকোয়েস্ট",
        Icon: MdPayments,
      },
    ],
  },
  {
    title: "যোগাযোগ",
    items: [
      { href: "/dashboard/messages", label: "ম্যাসেজ প্যানেল", Icon: MdSms },
      { href: "/dashboard/inbox", label: "হোয়াটসঅ্যাপ ইনবক্স", Icon: MdForum },
      { href: "/dashboard/link-visits", label: "লিংক হিস্ট্রি", Icon: MdLink },
      { href: "/dashboard/notice", label: "নোটিশ জেনারেটর", Icon: MdCampaign },
    ],
  },
  {
    title: "হিসাব",
    items: [
      {
        href: "/dashboard/accounts",
        label: "আয়-ব্যয়ের হিসাব",
        Icon: MdAccountBalanceWallet,
      },
      {
        href: "/dashboard/ledger",
        label: "বার্ষিক তালিকা (PDF)",
        Icon: MdMenuBook,
      },
      { href: "/dashboard/rent", label: "দোকান ভাড়া", Icon: MdStorefront },
    ],
  },
  {
    title: "সদস্য",
    items: [
      { href: "/dashboard/addUser", label: "অ্যাড ইউজার", Icon: MdPersonAdd },
    ],
  },
];
const ALL_ITEMS = MENU.flatMap((g) => g.items);

const isActive = (pathname, href) =>
  pathname === href || pathname.startsWith(`${href}/`);

function SidebarHeader() {
  return (
    <div className="flex items-center gap-2.5 px-6 pb-1 pt-5 text-white">
      <MdAdminPanelSettings className="text-2xl text-amber-300" />
      <span className="font-bold">এডমিন প্যানেল</span>
    </div>
  );
}

function MenuList({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col px-3 pb-6" aria-label="ড্যাশবোর্ড মেনু">
      {MENU.map((group) => (
        <div key={group.title}>
          <p className="px-3 pt-5 pb-1 text-[11px] font-semibold tracking-wider text-white/40">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-white text-[#0f3d2e] shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg transition ${
                        active
                          ? "bg-emerald-100 text-[#0f3d2e]"
                          : "bg-white/10 text-amber-200 group-hover:bg-white/15"
                      }`}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-2.5 mt-6 text-sm transition rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
      >
        <MdArrowBack /> মূল সাইটে ফিরুন
      </Link>
    </nav>
  );
}

function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ALL_ITEMS.find((i) => isActive(pathname, i.href));

  // close the drawer after navigating
  useEffect(() => setOpen(false), [pathname]);

  // drawer open: lock page scroll, Escape closes
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div>
      <Navbar />

      {/* phones: slim bar under the navbar with the menu button + current page */}
      <div className="sticky z-30 flex items-center gap-3 px-3 py-2 border-b top-16 border-slate-200 bg-white/90 backdrop-blur md:hidden print:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="ড্যাশবোর্ড মেনু খুলুন"
          className="flex items-center justify-center w-9 h-9 text-xl text-white rounded-lg bg-[#0f3d2e]"
        >
          <MdMenu />
        </button>
        <p className="min-w-0 text-sm font-semibold truncate text-[#0f3d2e]">
          {current?.label ?? "এডমিন প্যানেল"}
        </p>
      </div>

      <div className="flex">
        {/* tablets / desktops: fixed sidebar */}
        <aside className="hidden w-64 md:block shrink-0 print:hidden">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-b from-[#0f3d2e] to-[#0a2c21]">
            <SidebarHeader />
            <MenuList pathname={pathname} />
          </div>
        </aside>

        <div className="flex-grow min-w-0 bg-orange-50 print:bg-white">
          {children}
        </div>
      </div>

      {/* phones: slide-in drawer */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-50 transition-[visibility] duration-300 md:hidden print:hidden ${
          open ? "visible" : "invisible"
        }`}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-gradient-to-b from-[#0f3d2e] to-[#0a2c21] shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pr-3">
            <SidebarHeader />
            <button
              onClick={() => setOpen(false)}
              aria-label="মেনু বন্ধ করুন"
              className="flex items-center justify-center mt-4 text-xl rounded-lg w-9 h-9 text-white/80 hover:bg-white/10"
            >
              <MdClose />
            </button>
          </div>
          <MenuList pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function DashboardRootLayout({ children }) {
  return (
    <AdminRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminRoute>
  );
}
