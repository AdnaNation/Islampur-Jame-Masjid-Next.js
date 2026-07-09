"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { FaTimes } from "react-icons/fa";
import { MdAssistantDirection } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import Swal from "sweetalert2";
import useAdmin from "@/hooks/useAdmin";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
const FeePage = () => {
  const [isAdmin] = useAdmin();
  const [selectedId, setSelectedId] = useState("67b579d9992b1fd00b488aef");
  const [userData, setUserData] = useState({});
  const [name, setName] = useState(userData.Name);
  const [nameBn, setNameBn] = useState(userData.NameBn);
  const [HomeName, setHomeName] = useState(userData.HomeName);
  const [number, setNumber] = useState(userData.Number);
  const [feeRate, setFeeRate] = useState(userData.FeeRate);
  const [dueFee, setDueFee] = useState(userData.Due);
  const [tarabiFee, setTarabiFee] = useState(userData?.Tarabi?.fee);
  const [search, setSearch] = useState("");
  const [banglaText, setBanglaText] = useState(" ");
  const [selectedHome, setSelectedHome] = useState(" ");
  const [currentYear, setCurrentYear] = useState(true);
  const [homeName] = useHomeName();
  const axiosPublic = useAxiosPublic();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);
  const [isOpen4, setIsOpen4] = useState(false);
  const [isOpen5, setIsOpen5] = useState(false);
  const [isOpen6, setIsOpen6] = useState(false);
  const [isOpen7, setIsOpen7] = useState(false);
  const [seeMore, setSeeMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = new Date().toLocaleString();
  const year = new Date().getFullYear();
  const prevYear = year - 1;
  const monthTranslation = {
    January: "জানুয়ারি",
    February: "ফেব্রুয়ারি",
    March: "মার্চ",
    April: "এপ্রিল",
    May: "মে",
    June: "জুন",
    July: "জুলাই",
    August: "আগস্ট",
    September: "সেপ্টেম্বর",
    October: "অক্টোবর",
    November: "নভেম্বর",
    December: "ডিসেম্বর",
  };

  const {
    data: users = [],
    isPending: isUsersLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", selectedHome, search, banglaText],
    queryFn: async () =>
      await axiosPublic.get(
        `/users?search=${search}&HomeName=${selectedHome}&searchBn=${banglaText}`,
      ),
  });
  const {
    data = {},
    refetch: reload,
    isPending: dataLoading,
  } = useQuery({
    queryKey: ["dataById", selectedId],
    queryFn: async () => await axiosPublic.get(`user/${selectedId}`),
  });
  const { data: active, refetch: refresh } = useQuery({
    queryKey: ["activeStatus"],
    queryFn: async () => await axiosPublic.get("/activeStatus"),
  });
  const handleUserDetails = (user) => {
    setSelectedMonths([]);
    document.getElementById("my_modal_1").showModal();
    setSelectedId(user._id);
    reload();
    setUserData(user);
    refetch();
    setCurrentYear(true);
  };

  const handleHome = async (e) => {
    setSelectedHome(e.target.value);
    await refetch();
  };
  const handleSearch = (e) => {
    if (/[\u0980-\u09FF]/.test(e.target.value)) {
      setBanglaText(e.target.value);
    } else {
      setSearch(e.target.value);
      setBanglaText(" ");
    }
  };

  const handleSeeMore = () => {
    setSeeMore(!seeMore);
  };

  useEffect(() => {
    setFeeRate(userData.FeeRate);
    setDueFee(userData.Due);
    setTarabiFee(userData?.Tarabi?.fee);
    setName(userData.Name);
    setNameBn(userData.NameBn);
    setHomeName(userData.HomeName);
    setNumber(userData.Number);
    refetch();
    refresh();
  }, [userData, refetch, refresh]);

  const handleUserData = (e, id) => {
    e.preventDefault();
    const form = e.target;
    const Name = form.Name.value;
    const NameBn = form.NameBn.value;
    const HomeName = form.HomeName.value;
    const Number = form.Number.value;
    const userData = {
      Name,
      NameBn,
      HomeName,
      Number,
    };

    axiosPublic.patch(`/editUserData/${id}`, userData).then((res) => {
      if (res.data.modifiedCount > 0) {
        refetch();
        reload();
        setIsOpen7(false);
      }
    });
  };

  const handleFeeRate = (e, id) => {
    e.preventDefault();
    refetch();
    const form = e.target;
    const FeeRate = form.FeeRate.value;
    const TarabiFee = form.Tarabi.value;
    const DueFee = form.Due.value;
    const fees = {
      FeeRate,
      TarabiFee,
      DueFee,
    };
    axiosPublic.patch(`/editFee/${id}`, fees).then((res) => {
      if (res.data.modifiedCount > 0) {
        reload();
        setIsOpen2(false);
        refetch();
        Swal.fire({
          position: "top-end",
          title: "চাঁদা সেইভ করা হয়েছে",
          showConfirmButton: false,
          timer: 800,
        });
      }
    });
  };
  const handleModal = (monthName, id) => {
    setSelectedMonth(monthName);
    setId(id);
    setIsOpen(true);
  };

  // calculation.........
  const currentMonthIndex = new Date().getMonth();
  // console.log(data?.data?.PayMonths[currentMonthIndex]?.monthName);
  const userFeeRate = Number(data?.data?.FeeRate);
  const TarabiFee =
    active?.data && data?.data?.Tarabi?.status === "unpaid"
      ? Number(data?.data?.Tarabi?.fee)
      : 0;
  const totalDue =
    data?.data?.PayMonths?.slice(0, currentMonthIndex + 1).filter(
      (m) => m.status === "unpaid",
    ).length *
      userFeeRate +
    Number(data?.data?.Due) +
    TarabiFee;

  // checkbox for multiple months
  const handleCheckboxChange = (monthName, id) => {
    if (data?.data?._id === id) {
      setSelectedMonths((prevSelected) =>
        prevSelected.includes(monthName)
          ? prevSelected.filter((m) => m !== monthName)
          : [...prevSelected, monthName],
      );
    }
  };

  const handleMonthStatus = async () => {
    const number = data?.data?.Number;
    const message = `ইসলামপুর জামে মসজিদের ${selectedMonth}'র মাসিক চাঁদা বাবদ ৳${data?.data?.FeeRate} পরিশোধ করেছেন।`;

    const paymentData = {
      userId: data?.data?._id,
      name: data?.data?.NameBn,
      home: data?.data.HomeName,
      fee: data?.data?.FeeRate,
      monthName: selectedMonth,
      type: "Monthly",
      time,
      year,
    };
    setLoading(true);
    await axiosPublic
      .patch("/monthStatus", { id, selectedMonth })
      .then((res) => {
        if (res.data.modifiedCount > 0) {
          reload();
          setLoading(false);
          setIsOpen(false);
          axiosPublic.post("/payment", paymentData);
          if (number.length === 11) {
            axiosPublic.post("/sms", { number, message });
          }
        }
      });
  };

  const yearHandle = () => {
    setCurrentYear(!currentYear);
  };
  const handleMultiMonthsPay = async () => {
    const number = data?.data?.Number;
    const shortMonths = selectedMonths.map((m) => m.slice(0, 3));
    const message = `আপনি ${shortMonths}'র মাসিক চাঁদা বাবদ ৳${
      data?.data?.FeeRate * selectedMonths.length
    } পরিশোধ করেছেন।
    
-ইসলামপুর জামে মসজিদ`;
    const paymentData = {
      userId: data?.data?._id,
      name: data?.data?.NameBn,
      home: data?.data.HomeName,
      fee: data?.data?.FeeRate * selectedMonths.length,
      monthName: shortMonths.join(" ,"),
      type: "Monthly",
      time,
      year,
    };
    setLoading(true);
    await axiosPublic
      .patch("/multiple-months", {
        id: selectedId,
        months: selectedMonths,
      })
      .then((res) => {
        if (res.data.modifiedCount > 0) {
          reload();
          setSelectedMonths("");
          setLoading(false);
          setIsOpen3(false);
          axiosPublic.post("/payment", paymentData);
          if (number.length === 11) {
            axiosPublic.post("/sms", { number, message });
          }
        }
      });
  };

  const handleViewFee = () => {
    setIsOpen4(true);
  };

  const handleDuePayModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleDue = async () => {
    setLoading(true);
    const number = data?.data?.Number;
    const payingDue = dueFee;
    const DueFee = Number(data?.data?.Due) - Number(payingDue);
    const message = `আপনি আগের বছরের বকেয়া চাঁদা বাবদ ৳${payingDue} পরিশোধ করেছেন।

-ইসলামপুর জামে মসজিদ`;
    const PayingFee = {
      DueFee,
    };
    await axiosPublic
      .patch(`/payDue/${data?.data?._id}`, PayingFee)
      .then((res) => {
        console.log(res);
        if (res.data.modifiedCount > 0) {
          reload();
          const paymentData = {
            userId: data?.data?._id,
            name: data?.data?.NameBn,
            home: data?.data.HomeName,
            fee: payingDue,
            type: "Due",
            time,
            year,
          };
          axiosPublic.post("/payment", paymentData);
          if (number.length === 11) {
            axiosPublic.post("/sms", { number, message });
          }
          setLoading(false);
          setIsOpen6(false);
        }
      });
  };

  const handleDueModal = () => {
    setIsOpen6(true);
    setDueFee(data?.data?.Due);
  };

  const handleTarabeeModal = () => {
    setIsOpen5(true);
  };
  const handleTarabeeFee = async () => {
    setLoading(true);
    const number = data?.data?.Number;
    const message = `আপনি তারাবীর চাঁদা বাবদ ৳${data?.data?.Tarabi?.fee} পরিশোধ করেছেন।
    
    -ইসলামপুর জামে মসজিদ`;
    await axiosPublic.patch(`/tarabeePaid/${selectedId}`).then((res) => {
      if (res.data.modifiedCount > 0) {
        reload();
        refetch();
        setLoading(false);
        setIsOpen5(false);
        const paymentData = {
          userId: data?.data?._id,
          name: data?.data?.NameBn,
          home: data?.data.HomeName,
          fee: data?.data?.Tarabi?.fee,
          type: "Tarabi",
          time,
          year,
        };
        axiosPublic.post("/payment", paymentData);
        if (number.length === 11) {
          axiosPublic.post("/sms", { number, message });
        }
      }
    });
  };
  return (
    <div className="mt-16">
      <div className="flex max-w-xl">
        <div className="navbar bg-base-100">
          <div className="flex navbar-center">
            <select
              onChange={handleHome}
              className="p-2 border rounded md:max-w-52 max-w-32"
            >
              <option value="" className="font-bold bg-red-50">
                বাড়ির নাম
              </option>
              {homeName.map((home) => (
                <option value={home} key={home}>
                  {" "}
                  {home}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 border rounded-lg">
            <input
              onChange={handleSearch}
              type="search"
              name="search"
              placeholder="Search"
              className="w-full p-2"
              id=""
            />
          </div>
          <div></div>
        </div>
      </div>
      {isUsersLoading ? (
        <div className="flex flex-col items-center w-full h-full gap-4 animate-pulse">
          <div className="space-y-8">
            <div className="w-48 h-6 rounded-md bg-slate-400" />
            <div className="h-4 mx-auto mt-3 rounded-md w-28 bg-slate-400" />
          </div>
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
          <div className="w-full rounded-md h-7 bg-slate-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th></th>
                <th>
                  <p className="text-center">নাম ও নাম্বার</p>
                </th>
                <th className="text-center">বাড়ির নাম</th>
                <th className="text-center">চাঁদার হার</th>
              </tr>
            </thead>
            {seeMore ? (
              <tbody>
                {users?.data.map((user, index) => (
                  <tr
                    className="btn-ghost"
                    onClick={() => handleUserDetails(user)}
                    key={user._id}
                  >
                    {" "}
                    <th>{index + 1}</th>
                    <td className="text-[12px]">
                      <p
                        className={`${
                          user?.PayMonths[currentMonthIndex]?.status ===
                            "unpaid" && "text-red-500"
                        } text-center`}
                      >
                        {user.NameBn} <br /> {isAdmin && user.Number}
                      </p>
                    </td>
                    <th className="text-[12px] text-center">{user.HomeName}</th>
                    <td>
                      <p className="text-center">{user.FeeRate}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {users?.data?.slice(0, 10).map((user, index) => (
                  <tr
                    className="btn-ghost"
                    onClick={() => handleUserDetails(user)}
                    key={user._id}
                  >
                    <th>{index + 1}</th>
                    <td className="text-[12px]">
                      <p
                        className={`${
                          user?.PayMonths[currentMonthIndex]?.status ===
                            "unpaid" && "text-red-500"
                        } text-center`}
                      >
                        {user.NameBn} <br /> {isAdmin && user.Number}
                      </p>
                    </td>
                    <th className="text-[12px] text-center">{user.HomeName}</th>
                    <td>
                      <p className="text-center">{user.FeeRate}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {users?.data?.length > 10 && (
            <button
              onClick={handleSeeMore}
              className="relative z-10 flex items-center justify-center gap-2 px-4 py-1 mx-auto overflow-hidden border-2 rounded-full shadow-xl text-md bg-gray-50 backdrop-blur-md lg:font-semibold isolation-auto border-gray-50 before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-emerald-500 hover:text-gray-50 before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 group"
            >
              {seeMore ? "ফিরে যান" : "আরো দেখুন"}
              <svg
                className="justify-end w-8 h-8 p-2 duration-300 ease-linear rotate-45 border border-gray-700 rounded-full group-hover:rotate-90 group-hover:bg-gray-50 text-gray-50 group-hover:border-none"
                viewBox="0 0 16 19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                  className="fill-gray-800 group-hover:fill-gray-800"
                />
              </svg>
            </button>
          )}

          <dialog id="my_modal_1" className="modal">
            <div className="modal-box bg-orange-50">
              {/* ............ */}

              <div className="flex flex-col items-center max-w-2xl mx-auto bg-gray-100">
                <div className="w-full p-2 bg-white rounded-lg shadow-md">
                  <div className="flex justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-sm font-bold md:text-xl">
                        ইসলামপুর জামে মসজিদ
                      </h2>
                      <p className="text-sm text-gray-600 md:text-xl">
                        দক্ষিণ চন্ডিপুর, ইসলামপুর
                      </p>
                    </div>
                    <div className="flex items-center justify-center text-right">
                      <p className="text-gray-600">
                        {currentYear ? date : prevYear}
                      </p>
                      <button onClick={yearHandle}>
                        <p className="text-blue-600">
                          <MdAssistantDirection />
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b">
                    <div className="relative pb-2 mt-2 group">
                      <p className="text-sm">{data?.data?.NameBn},</p>
                      <p className="text-sm">{data?.data?.HomeName}</p>

                      {isAdmin && (
                        <button
                          className=" absolute -top-7 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
                          onClick={() => setIsOpen7(true)}
                        >
                          <CiEdit />
                        </button>
                      )}
                    </div>

                    <div className="relative group">
                      <div className="pb-2 mt-2">
                        {currentYear ? (
                          <p className="text-sm font-semibold">
                            চাঁদার হার: {data?.data?.FeeRate}{" "}
                            <small>টাকা</small>
                          </p>
                        ) : (
                          <p className="text-sm font-semibold">
                            চাঁদার হার: {data?.data?.prevYear?.FeeRate}{" "}
                            <small>টাকা</small>
                          </p>
                        )}
                        {currentYear ? (
                          <p className="text-sm font-semibold">
                            তারাবীর চাঁদা: {data?.data?.Tarabi?.fee}{" "}
                            <small>টাকা</small>
                          </p>
                        ) : (
                          <p className="text-sm font-semibold">
                            তারাবীর চাঁদা: {data?.data?.prevYear?.Tarabi?.fee}{" "}
                            <small>টাকা</small>
                          </p>
                        )}
                        {currentYear ? (
                          <p className="flex flex-row items-center gap-1 text-sm font-semibold">
                            বকেয়া চাঁদা: <span>{totalDue ? totalDue : 0}</span>
                            <small>টাকা</small>
                            <button className="text-lg" onClick={handleViewFee}>
                              <p className="text-blue-600">
                                <MdAssistantDirection />
                              </p>
                            </button>
                          </p>
                        ) : (
                          <p className="flex flex-row items-center gap-1 text-sm font-semibold">
                            বকেয়া চাঁদা:{" "}
                            <span>{data?.data?.prevYear?.Due}</span>{" "}
                            <small>টাকা</small>
                          </p>
                        )}
                      </div>
                      {currentYear && isAdmin && (
                        <button
                          className=" absolute -top-7 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
                          onClick={() => setIsOpen2(true)}
                        >
                          <CiEdit />
                        </button>
                      )}
                    </div>
                  </div>
                  {isOpen2 && (
                    <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black bg-opacity-50 modal modal-open">
                      <div className="px-4 pt-8 bg-white rounded-lg modal-box w-96">
                        <button
                          onClick={() => setIsOpen2(false)}
                          className="absolute text-xl btn btn-sm btn-circle btn-ghost right-2 top-1"
                        >
                          ✕
                        </button>
                        <form onSubmit={(e) => handleFeeRate(e, userData._id)}>
                          <div className="flex flex-col items-center justify-center gap-6 pt-8 border">
                            {/* Fee Rate Input */}
                            <div className="relative w-full px-4">
                              <input
                                name="FeeRate"
                                type="text"
                                value={feeRate}
                                onChange={(e) => setFeeRate(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="FeeRate"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                চাঁদার হার
                              </label>
                            </div>

                            {/* Tarabi Fee Input */}
                            <div className="relative w-full px-4">
                              <input
                                name="Tarabi"
                                type="text"
                                value={tarabiFee}
                                onChange={(e) => setTarabiFee(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="Tarabi"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                তারাবীর চাঁদা
                              </label>
                            </div>

                            {/* Due Fee Input */}
                            <div className="relative w-full px-4">
                              <input
                                name="Due"
                                type="text"
                                value={dueFee}
                                onChange={(e) => setDueFee(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="Due"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                আগের বকেয়া চাঁদা
                              </label>
                            </div>

                            {/* Submit Button */}
                            <input
                              name="submit"
                              type="submit"
                              value="সেইভ"
                              className="px-6 mb-1 text-white bg-blue-800 rounded-lg btn-outline"
                            />
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  {isOpen7 && (
                    <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black bg-opacity-50 modal modal-open">
                      <div className="px-4 pt-8 bg-white rounded-lg modal-box w-96">
                        <button
                          onClick={() => setIsOpen7(false)}
                          className="absolute text-xl btn btn-sm btn-circle btn-ghost right-2 top-1"
                        >
                          ✕
                        </button>
                        <form onSubmit={(e) => handleUserData(e, userData._id)}>
                          <div className="flex flex-col items-center justify-center gap-6 pt-8 border">
                            <div className="relative w-full px-4">
                              <input
                                name="NameBn"
                                type="text"
                                value={nameBn}
                                onChange={(e) => setNameBn(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="NameBn"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                নাম
                              </label>
                            </div>
                            <div className="relative w-full px-4">
                              <input
                                name="Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="Name"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                নাম ইংরেজি
                              </label>
                            </div>

                            <div className="relative w-full px-4">
                              <input
                                name="HomeName"
                                type="text"
                                value={HomeName}
                                onChange={(e) => setHomeName(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="HomeName"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                বাড়ির নাম
                              </label>
                            </div>

                            <div className="relative w-full px-4">
                              <input
                                name="Number"
                                type="text"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                              />
                              <label
                                htmlFor="Number"
                                className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                              >
                                নাম্বার
                              </label>
                            </div>

                            {/* Submit Button */}
                            <input
                              name="submit"
                              type="submit"
                              value="সেইভ"
                              className="px-6 mb-1 text-white bg-blue-800 rounded-lg btn-outline"
                            />
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="mt-1">
                    <h1 className="font-mono text-sm font-bold text-center">
                      পেমেন্ট ডিটেইলস
                    </h1>
                    {dataLoading && (
                      <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                        <div className="w-full rounded-md h-7 bg-slate-400" />
                      </div>
                    )}
                    {currentYear && userData?.PayMonths && (
                      <div className="grid w-full grid-cols-2 border ">
                        <div className="p-1 border-r-2">
                          {/* First 6 months */}
                          {data?.data?.PayMonths?.slice(0, 6).map(
                            (user, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-1 py-2 border-b"
                              >
                                {user.status === "unpaid" && isAdmin && (
                                  <input
                                    name="checkbox"
                                    type="checkbox"
                                    checked={selectedMonths.includes(
                                      user.monthName,
                                    )}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        user.monthName,
                                        selectedId,
                                      )
                                    }
                                    className="w-3 h-3"
                                  />
                                )}

                                <div className="font-bold text-md">
                                  {monthTranslation[user.monthName] ||
                                    user.monthName}
                                </div>
                                <button
                                  onClick={() =>
                                    isAdmin &&
                                    handleModal(user.monthName, selectedId)
                                  }
                                  className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                                    user.status === "paid"
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }`}
                                >
                                  {user.status === "paid" ? (
                                    <TiTick />
                                  ) : (
                                    <FaTimes />
                                  )}
                                </button>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="p-1 border-l-2">
                          {/* Last 6 months */}
                          {data?.data?.PayMonths?.slice(6).map(
                            (user, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b"
                              >
                                {user.status === "unpaid" && isAdmin && (
                                  <input
                                    name="checkbox"
                                    type="checkbox"
                                    checked={selectedMonths.includes(
                                      user.monthName,
                                    )}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        user.monthName,
                                        selectedId,
                                      )
                                    }
                                    className="w-3 h-3"
                                  />
                                )}

                                <div className="font-bold text-md">
                                  {monthTranslation[user.monthName] ||
                                    user.monthName}
                                </div>
                                <button
                                  onClick={() =>
                                    isAdmin &&
                                    handleModal(user.monthName, selectedId)
                                  }
                                  className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                                    user.status === "paid"
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }`}
                                >
                                  {user.status === "paid" ? (
                                    <TiTick />
                                  ) : (
                                    <FaTimes />
                                  )}
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {!currentYear && userData?.PayMonths && (
                      <div className="grid w-full grid-cols-2 border ">
                        <div className="p-1 border-r-2">
                          {/* First 6 months */}
                          {data?.data?.prevYear?.PayMonths?.slice(0, 6).map(
                            (user, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-1 py-2 border-b"
                              >
                                <div className="font-bold text-md">
                                  {monthTranslation[user.monthName] ||
                                    user.monthName}
                                </div>
                                <button
                                  className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                                    user.status === "paid"
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }`}
                                >
                                  {user.status === "paid" ? (
                                    <TiTick />
                                  ) : (
                                    <FaTimes />
                                  )}
                                </button>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="p-1 border-l-2">
                          {/* Last 6 months */}
                          {data?.data?.prevYear?.PayMonths?.slice(6).map(
                            (user, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b"
                              >
                                <div className="font-bold text-md">
                                  {monthTranslation[user.monthName] ||
                                    user.monthName}
                                </div>
                                <button
                                  className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                                    user.status === "paid"
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }`}
                                >
                                  {user.status === "paid" ? (
                                    <TiTick />
                                  ) : (
                                    <FaTimes />
                                  )}
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-4 text-left">
                    <div className="font-bold text-md">
                      তারাবীঃ{" "}
                      {currentYear ? (
                        <button
                          onClick={isAdmin && handleTarabeeModal}
                          className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                            data?.data?.Tarabi?.status === "paid"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {data?.data?.Tarabi?.status === "paid" ? (
                            <TiTick />
                          ) : (
                            <FaTimes />
                          )}
                        </button>
                      ) : (
                        <button
                          className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                            data?.data?.prevYear?.Tarabi?.status === "paid"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {data?.data?.prevYear?.Tarabi?.status === "paid" ? (
                            <TiTick />
                          ) : (
                            <FaTimes />
                          )}
                        </button>
                      )}
                    </div>
                    {data?.data?.Due > 0 && (
                      <div className="font-bold text-md">
                        বকেয়াঃ {""}
                        <button
                          onClick={isAdmin && handleDueModal}
                          className={`inline-flex items-center justify-center px-2 py-2 transition ease-in-out delay-75 text-white text-sm font-medium rounded-md ${
                            data?.data?.Due < 0
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {data?.data?.Due < 0 ? <TiTick /> : <FaTimes />}
                        </button>
                      </div>
                    )}
                    {selectedMonths.length > 1 && (
                      <div>
                        <button
                          onClick={() => setIsOpen3(true)}
                          className="text-white bg-red-500 btn btn-xs"
                        >
                          সব পেইড?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* <div className="mt-6 text-center">
                  <button className="px-6 py-2 text-white bg-blue-600 rounded-md">
                    Download PDF
                  </button>
                </div> */}
                </div>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  <button className="btn">Close</button>
                </form>
                <div>
                  {/* Modal */}
                  {isOpen && (
                    <div className="modal modal-middle modal-open">
                      <div className="modal-box">
                        <p className="py-2 text-center">
                          চাঁদা দেয়ার ব্যাপারটা আপনি কি নিশ্চিত?
                        </p>
                        <div className="flex justify-evenly">
                          <button
                            onClick={() => setIsOpen(false)}
                            className="inline-block px-5 font-semibold leading-6 text-center transition duration-200 bg-red-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            না
                          </button>
                          <button
                            onClick={handleMonthStatus}
                            className="flex items-center px-5 font-semibold leading-6 text-center transition duration-200 bg-green-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            হ্যাঁ{" "}
                            {loading && (
                              <span className="w-3 loading loading-spinner"></span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isOpen3 && (
                    <div className="modal modal-middle modal-open">
                      <div className="modal-box">
                        <p className="py-2 text-center">
                          {selectedMonths.length} মাসের{" "}
                          {selectedMonths.length * userFeeRate} টাকা চাঁদা দেয়ার
                          ব্যাপারটা <br /> আপনি কি নিশ্চিত?
                        </p>
                        <div className="flex justify-evenly">
                          <button
                            onClick={() => setIsOpen3(false)}
                            className="inline-block px-5 font-semibold leading-6 text-center transition duration-200 bg-red-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            না
                          </button>
                          <button
                            onClick={handleMultiMonthsPay}
                            className="flex items-center px-5 font-semibold leading-6 text-center transition duration-200 bg-green-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            হ্যাঁ{" "}
                            {loading && (
                              <span className="w-3 loading loading-spinner"></span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isOpen4 && (
                    <div className="modal modal-top modal-open">
                      <div className="modal-box">
                        <p className="py-2 text-center">বকেয়ার বিবেরনী</p>
                        <p className="text-sm font-semibold">
                          তারাবীঃ {TarabiFee}
                          <br />
                          আগের বছরেরঃ {data?.data?.Due} টাকা , <br />
                          এই বছরেরঃ{" "}
                          {data?.data?.PayMonths?.slice(
                            0,
                            currentMonthIndex + 1,
                          ).filter((m) => m.status === "unpaid").length *
                            userFeeRate}{" "}
                          টাকা, <br />
                          টোটালঃ {totalDue} টাকা
                        </p>
                        <div className="flex justify-evenly">
                          <button
                            onClick={() => setIsOpen4(false)}
                            className="px-5 btn btn-xs"
                          >
                            ✕
                          </button>
                          {isAdmin && (
                            <button
                              className="px-5 btn btn-xs"
                              onClick={() => {
                                (setIsOpen4(false), setIsOpen2(true));
                              }}
                            >
                              <CiEdit />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isOpen5 && (
                    <div className="modal modal-bottom modal-open">
                      <div className="modal-box">
                        <p className="py-2 text-center">
                          তারাবীর {data?.data?.Tarabi?.fee} টাকা চাঁদা দেয়ার
                          ব্যাপারটা আপনি কি নিশ্চিত?
                        </p>
                        <div className="flex justify-evenly">
                          <button
                            onClick={() => setIsOpen5(false)}
                            className="inline-block px-5 font-semibold leading-6 text-center transition duration-200 bg-red-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            না
                          </button>
                          <button
                            onClick={handleTarabeeFee}
                            className="flex items-center px-5 font-semibold leading-6 text-center transition duration-200 bg-green-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                          >
                            হ্যাঁ{" "}
                            {loading && (
                              <span className="w-3 loading loading-spinner"></span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {isOpen6 && (
                    <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black bg-opacity-50 modal modal-open">
                      <div className="px-4 pt-8 bg-white rounded-lg modal-box w-96">
                        <button
                          onClick={() => {
                            (setIsOpen6(false), setIsModalOpen(false));
                          }}
                          className="absolute text-xl btn btn-sm btn-circle btn-ghost right-2 top-1"
                        >
                          ✕
                        </button>
                        {isModalOpen ? (
                          <div className="">
                            <p className="py-2 text-center">
                              বকেয়ার {dueFee} টাকা পরিশোধ করার ব্যাপারটা আপনি কি
                              নিশ্চিত?
                            </p>
                            <div className="flex justify-evenly">
                              <button
                                onClick={() => setIsModalOpen(false)}
                                className="inline-block px-5 font-semibold leading-6 text-center transition duration-200 bg-red-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                              >
                                না
                              </button>
                              <button
                                onClick={handleDue}
                                className="flex items-center px-5 font-semibold leading-6 text-center transition duration-200 bg-green-500 rounded-lg btn btn-xs sm:w-auto text-blue-50 hover:bg-green-600"
                              >
                                হ্যাঁ{" "}
                                {loading && (
                                  <span className="w-3 loading loading-spinner"></span>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={(e) => handleDuePayModal(e)}>
                            <div className="flex flex-col items-center justify-center gap-6 pt-8 border">
                              {/* Due Fee Input */}
                              <div className="relative w-full px-4">
                                <input
                                  name="Due"
                                  type="text"
                                  value={dueFee}
                                  onChange={(e) => setDueFee(e.target.value)}
                                  className="w-full py-1 transition-colors border-b border-gray-300 focus:border-b-2 focus:border-blue-700 focus:outline-none peer bg-inherit"
                                />
                                <label
                                  htmlFor="Due"
                                  className="absolute left-0 text-xs transition-all -top-4 cursor-text peer-focus:text-xs peer-focus:-top-4 peer-focus:text-blue-700 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                                >
                                  আগের বকেয়া চাঁদা
                                </label>
                              </div>

                              {/* Submit Button */}
                              <input
                                name="submit"
                                type="submit"
                                value="পেইড"
                                className="px-6 mb-1 text-white bg-blue-800 rounded-lg btn-outline"
                              />
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
};

export default FeePage;
