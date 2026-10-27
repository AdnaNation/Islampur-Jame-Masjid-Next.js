"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { ME_KEY } from "@/hooks/useSession";
import { useState } from "react";

const AdminSignIn = () => {
  const axiosPublic = useAxiosPublic();
  const qc = useQueryClient();
  const [alert, setAlert] = useState(" ");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // The server checks the number + PIN and sets a secure cookie.
  // The PIN never comes back to the browser, and nothing sensitive is kept in localStorage.
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAlert(" ");
    setBusy(true);
    const form = e.target;
    try {
      await axiosPublic.post("/auth/login", {
        number: form.number.value.trim(),
        password: form.password.value,
      });
      await qc.invalidateQueries({ queryKey: ME_KEY });
      router.push("/");
    } catch (err) {
      setAlert(
        err?.response?.status === 429
          ? "অনেকবার ভুল হয়েছে, একটু পরে চেষ্টা করুন"
          : "কিছু একটা ভুল আছে",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSignIn}
      className="mx-auto space-y-2 md:max-w-80 mt-14"
    >
      <label className="px-1 mx-auto form-control md:w-96 w-72">
        <div className="label">
          <span className="label-text">আপনার নাম্বার কী?</span>
        </div>
        <input
          name="number"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="আপনার নাম্বার"
          className="w-full input input-bordered"
        />
        <div className="label">
          <span className="label-text">আপনার পিন কী?</span>
        </div>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="আপনার পিন"
          className="w-full input input-bordered"
        />
        {alert && (
          <p className="text-[10px] text-red-600 text-right">{alert}</p>
        )}
        <div className="flex justify-end label">
          <Link href="/signin" className="text-sm text-blue-600 underline">
            সদস্য?..
          </Link>
        </div>
      </label>
      <div className="text-center">
        <button
          className="btn btn-outline btn-info"
          type="submit"
          disabled={busy}
        >
          প্রবেশ করুন
        </button>
      </div>
    </form>
  );
};

export default AdminSignIn;
