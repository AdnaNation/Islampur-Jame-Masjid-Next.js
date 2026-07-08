"use client";

import Link from "next/link";
import { ImHome } from "react-icons/im";
import { TbCoinTakaFilled } from "react-icons/tb";
import { IoLogIn, IoLogOut } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { FaHistory } from "react-icons/fa";
import useAdmin from "@/hooks/useAdmin";
import { getLocalStorage, removeLocalStorage } from "@/lib/localStorage";

const Navbar = () => {
  const userNumber = getLocalStorage("Number");
  const [isAdmin] = useAdmin();

  return (
    <div className="top-0 navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow space-y-1"
          >
            <Link href="/" className="text-xl md:text-2xl">
              <ImHome />
            </Link>
            <Link href="/fee" className="text-xl md:text-2xl">
              <TbCoinTakaFilled />{" "}
            </Link>
            <Link href="/payment" className="text-xl md:text-2xl">
              <FaHistory />{" "}
            </Link>
            {isAdmin && (
              <Link href="/dashboard/home" className="text-xl md:text-2xl">
                <MdDashboard />{" "}
              </Link>
            )}
            {userNumber ? (
              <button
                onClick={() => removeLocalStorage("Number")}
                className="text-xl md:text-2xl"
              >
                <IoLogOut />
              </button>
            ) : (
              <Link href="/signin" className="text-xl md:text-2xl">
                <IoLogIn />
              </Link>
            )}
          </ul>
        </div>
        <a className="text-xl btn btn-ghost">Islampur Jame Masjid</a>
      </div>
      <div className="hidden navbar-center lg:flex">
        <ul className="px-1 menu menu-horizontal">
          <Link className="mr-3 text-2xl" href="/">
            <ImHome />
          </Link>
          <Link className="mr-3 text-2xl" href="/fee">
            <TbCoinTakaFilled />
          </Link>
          <Link className="mr-3 text-2xl" href="/payment">
            <FaHistory />
          </Link>
          {isAdmin && (
            <Link href="/dashboard/home" className="mr-1 text-2xl">
              <MdDashboard />{" "}
            </Link>
          )}
        </ul>
      </div>
      <div className="navbar-end">
        <a
          href="/"
          className="flex items-center px-4 py-2 space-x-2 text-white transition duration-300 rounded-md hover:bg-gray-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Icons/profile.svg"
            alt="Profile"
            className="w-6 h-6 border-2 border-white rounded-full"
          />
        </a>
      </div>
    </div>
  );
};

export default Navbar;
