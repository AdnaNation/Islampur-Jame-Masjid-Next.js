"use client";

import { useState } from "react";
import Link from "next/link";
import { MdDoubleArrow } from "react-icons/md";
import { ImCross } from "react-icons/im";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminRoute from "@/components/AdminRoute";

function DashboardLayout({ children }) {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const handleToggle = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };
  return (
    <div>
      <Navbar />
      <div className="flex">
        <div>
          <div className="hidden min-h-screen border-r-2 shadow-sm md:block bg-zinc-100 md:min-w-56">
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/home">এডমিন হোম</Link>
              <Link href="/dashboard/addUser">অ্যাড ইউজার</Link>
              <Link href="/dashboard/rent">দোকান ভাড়া</Link>
            </div>
          </div>
          <div
            className={`fixed z-10 left-0 min-h-screen transition-transform duration-300 ease-in-out transform border-r-2 shadow-sm top-16 md:hidden bg-zinc-100 min-w-48 ${
              isDashboardOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {" "}
            {isDashboardOpen ? (
              <div className="text-right">
                <button onClick={handleToggle}>
                  <ImCross />
                </button>
              </div>
            ) : (
              <div className="-mr-5 text-right">
                <button onClick={handleToggle}>
                  <MdDoubleArrow />
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Link onClick={handleToggle} href="/dashboard/home">
                এডমিন হোম
              </Link>
              <Link onClick={handleToggle} href="/dashboard/addUser">
                অ্যাড ইউজার
              </Link>
              <Link onClick={handleToggle} href="/dashboard/rent">
                দোকান ভাড়া
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-grow bg-orange-50">{children}</div>
      </div>
      <Footer />
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
