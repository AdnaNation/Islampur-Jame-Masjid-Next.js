"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";

const PaymentHistory = () => {
  const [homeName] = useHomeName();
  const [home, setHome] = useState("home");
  const [name, setName] = useState(" ");
  const axiosPublic = useAxiosPublic();
  const { data, refetch, isPending } = useQuery({
    queryKey: ["paymentHistory", home, name],
    queryFn: async () =>
      await axiosPublic.get(`/paymentHistory?home=${home}&name=${name}`),
  });
  const { data: userName = {}, refetch: reload } = useQuery({
    queryKey: ["usersName", home],
    queryFn: async () => await axiosPublic.get(`/usersName/${home}`),
  });
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleHome = async (e) => {
    setName(" ");
    setHome(e.target.value);
    await reload();
  };
  const handleName = (e) => {
    const name = e.target.value;
    setName(name.split(" (")[0]);
    reload();
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="flex justify-center gap-1 my-1">
        <select onChange={handleHome} className="w-40 p-2 border rounded">
          <option value="home" className="font-bold bg-red-50">
            বাড়ির নাম
          </option>
          {homeName.map((home) => (
            <option value={home} key={home}>
              {" "}
              {home}
            </option>
          ))}
        </select>

        <select
          disabled={home === "home"}
          onChange={handleName}
          className="w-40 p-2 border rounded"
        >
          <option value="" className="font-bold bg-red-50">
            নাম
          </option>
          {userName?.data?.map((name) => (
            <option value={name.NameBn} key={name._id}>
              {" "}
              {name.NameBn}
            </option>
          ))}
        </select>
      </div>

      {data?.data?.length === 0 && (
        <div className="mt-24 mx-auto w-full max-w-72 flex flex-wrap items-center justify-center py-3 pl-4 rounded-lg text-base font-medium [transition:all_0.5s_ease] border-solid border border-[#f85149] text-[#b22b2b] [&_svg]:text-[#b22b2b] group bg-[linear-gradient(#f851491a,#f851491a)]">
          <p className="flex flex-row items-center mr-auto gap-x-2">
            <p className="text-xs">{name}'র কোনো পেমেন্ট হিস্টোরি নেই!</p>
          </p>
        </div>
      )}

      {isPending && (
        <div className="flex justify-center mt-40 text-3xl animate-spin">
          <FiLoader />
        </div>
      )}
      <div className="flex justify-center">
        <div className="grid items-center justify-center max-w-5xl gap-2 md:grid-cols-3 bg-orange-50">
          {data?.data
            ?.slice()
            .reverse()
            .map((history) => (
              <div
                key={history._id}
                className="h-40 mx-2 mt-1 shadow-sm card bg-base-100 md:w-80 md:mx-0 "
              >
                <div className="p-5">
                  {/* <h2 className=" text-right text-[12px]">{history.time}</h2> */}
                  <h2 className="text-right text-[12px]">
                    {(() => {
                      const date = new Date(history.time);
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const year = date.getFullYear();
                      let hours = date.getHours();
                      const minutes = String(date.getMinutes()).padStart(
                        2,
                        "0"
                      );
                      const ampm = hours >= 12 ? "PM" : "AM";
                      hours = hours % 12 || 12;
                      const formattedTime = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
                      return formattedTime;
                    })()}
                  </h2>
                  <p>
                    {history.name} (
                    <small className="mr-1">{history.home}</small>){" "}
                    <small>{history.monthName && history.monthName}</small>{" "}
                    {history.type === "Monthly" && "মাসের মাসিক চাঁদা"}
                    {history.type === "Tarabi" && "তারাবীর"}{" "}
                    {history.type === "Due" && "বকেয়ার"} {history.fee} টাকা
                    পরিশোধ করেছেন।{" "}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
