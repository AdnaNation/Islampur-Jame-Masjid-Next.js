"use client";

import Link from "next/link";
import { ImHome } from "react-icons/im";
import { TbCoinTakaFilled } from "react-icons/tb";
import { IoLogIn, IoLogOut } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { FaAmazonPay, FaHistory } from "react-icons/fa";
import useAdmin from "@/hooks/useAdmin";
import { getLocalStorage, removeLocalStorage } from "@/lib/localStorage";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [userNumber, setUserNumber] = useState(null);
  const [isAdmin] = useAdmin();

  useEffect(() => {
    setUserNumber(getLocalStorage("Number"));
  }, []);

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
            <Link href="/bkash-payment" className="text-xl md:text-2xl">
              <FaAmazonPay />
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
                onClick={() => {
                  removeLocalStorage("Number");
                  setUserNumber(null);
                }}
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
          <Link href="/bkash-payment" className="mr-3 text-2xl">
            <FaAmazonPay />
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
      <div className="hidden navbar-end lg:flex">
        {userNumber ? (
          <button
            onClick={() => {
              removeLocalStorage("Number");
              setUserNumber(null);
            }}
            className="text-xl md:text-2xl"
          >
            <IoLogOut />
          </button>
        ) : (
          <Link href="/signin" className="text-xl md:text-2xl">
            <IoLogIn />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
