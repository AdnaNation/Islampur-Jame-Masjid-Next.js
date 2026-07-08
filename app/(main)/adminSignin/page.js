"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { useState } from "react";
import { setLocalStorage, removeLocalStorage } from "@/lib/localStorage";

const AdminSignIn = () => {
  const axiosPublic = useAxiosPublic();
  const [alert, setAlert] = useState(" ");
  const router = useRouter();
  const handleSignIn = async (e) => {
    setAlert(" ");
    e.preventDefault();
    const form = e.target;
    const number = form.number.value;
    const password = form.password.value;

    const signedData = await axiosPublic(`admin/${number}`);
    if (signedData.data.number) {
      if (
        signedData.data.number === number &&
        signedData.data.password === password
      ) {
        setLocalStorage("Number", number);
        const userInfo = { number: number };
        axiosPublic.post("/jwt", userInfo).then((res) => {
          if (res.data.token) {
            setLocalStorage("access-token", res.data.token);
          }
        });
        setAlert(" ");
        router.push("/fee");
      } else {
        removeLocalStorage("access-token");
        setAlert("কিছু একটা ভুল আছে");
      }
    } else {
      setAlert("কিছু একটা ভুল আছে");
    }
  };
  return (
    <form
      onSubmit={handleSignIn}
      className="mx-auto space-y-2  md:max-w-80 mt-14"
    >
      <label className="px-1 mx-auto form-control md:w-96 w-72">
        <div className="label">
          <span className="label-text">আপনার নাম্বার কী?</span>
        </div>
        <input
          name="number"
          type="text"
          placeholder="আপনার নাম্বার"
          className="w-full input input-bordered"
        />
        <div className="label">
          <span className="label-text">আপনার পিন কী?</span>
        </div>
        <input
          name="password"
          type="text"
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
        <button className="btn btn-outline btn-info" type="submit">
          প্রবেশ করুন
        </button>
      </div>
    </form>
  );
};

export default AdminSignIn;
