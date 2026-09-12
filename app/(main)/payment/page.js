"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import useAdmin from "@/hooks/useAdmin";

const PaymentHistory = () => {
  const [isAdmin] = useAdmin();
  const [homeName] = useHomeName();
  const [home, setHome] = useState("home");
  const [name, setName] = useState(" ");
  const [revertingId, setRevertingId] = useState(null);
  const axiosPublic = useAxiosPublic();
  const { data, refetch, isPending } = useQuery({
    queryKey: ["paymentHistory", home, name],
    queryFn: async () =>
      await axiosPublic.get(`/paymentHistory?home=${home}&name=${name}`),
  });

  const currentYear = new Date().getFullYear();
  const totalFeeCurrentYear = data?.data
    .filter((item) => Number(item.year) === currentYear)
    .reduce((sum, item) => sum + (Number(item.fee) || 0), 0);

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

  const typeLabel = (history) => {
    if (history.type === "Monthly")
      return `${history.monthName ? history.monthName + "'র " : ""}মাসিক চাঁদা`;
    if (history.type === "Tarabi") return "তারাবীর চাঁদা";
    if (history.type === "Due") return "বকেয়া চাঁদা";
    return "";
  };

  const canRevert = (history) => {
    const paidAt = new Date(history.time).getTime();
    if (Number.isNaN(paidAt)) return false;
    return Date.now() - paidAt <= 24 * 60 * 60 * 1000;
  };

  const handleRevert = async (history) => {
    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `<b>${history.name}</b> (${history.home})<br/>${typeLabel(
        history,
      )} ৳${history.fee} - এই পেমেন্টটি বাতিল করা হবে।<br/><br/>এতে সংশ্লিষ্ট মাস/তারাবী/বকেয়া আবার "অপরিশোধিত" হয়ে যাবে এবং সদস্যকে একটি SMS পাঠানো হবে। এটি বাতিল করা যাবে না।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, বাতিল করুন",
      cancelButtonText: "না",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    setRevertingId(history._id);
    try {
      await axiosPublic.patch(`/payment/${history._id}/revert`);
      Swal.fire({
        icon: "success",
        title: "বাতিল করা হয়েছে",
        timer: 1000,
        showConfirmButton: false,
      });
      refetch();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ব্যর্থ হয়েছে",
        text: err?.response?.data?.error || "আবার চেষ্টা করুন",
      });
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="flex justify-center gap-1 my-1">
        <select onChange={handleHome} className="w-40 p-2 border rounded">
          <option value="home" className="font-bold bg-red-50">
            বাড়ির নাম
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

      {isAdmin && (
        <p className="flex justify-end mr-6">
          {Math.floor(totalFeeCurrentYear) || 0}{" "}
        </p>
      )}

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
                className="h-40 mx-2 mt-1 shadow-sm card bg-base-100 md:w-80 md:mx-0"
              >
                <div className="p-5">
                  {/* <h2 className=" text-right text-[12px]">{history.time}</h2> */}

                  {history?.method && (
                    <div className="flex justify-end">
                      <p className="w-12 text-[10px] text-center text-white bg-red-500 rounded-lg right-1">
                        {history.method}
                      </p>{" "}
                    </div>
                  )}

                  <h2 className="text-right text-[12px]">
                    {(() => {
                      const date = new Date(history.time);
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const year = date.getFullYear();
                      let hours = date.getHours();
                      const minutes = String(date.getMinutes()).padStart(
                        2,
                        "0",
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
                    {history.type === "Due" && "বকেয়ার"} {history.fee} টাকা
                    পরিশোধ করেছেন।{" "}
                  </p>

                  {isAdmin && canRevert(history) && (
                    <div className="flex justify-end mt-2">
                      <button
                        disabled={revertingId === history._id}
                        onClick={() => handleRevert(history)}
                        className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                      >
                        {revertingId === history._id
                          ? "বাতিল হচ্ছে..."
                          : "বাতিল করুন"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
