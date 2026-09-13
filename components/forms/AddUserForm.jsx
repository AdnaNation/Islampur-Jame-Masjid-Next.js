"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import useHomeName from "@/hooks/useHomeName";
import useAxiosPublic from "@/hooks/useAxiosPublic";

const AddUser = () => {
  const [homeName] = useHomeName();
  const axiosPublic = useAxiosPublic();
  const [newHome, setNewHome] = useState(false);
  const [unpaidMonthsCount, setUnpaidMonthsCount] = useState(0);
  const toggleNewHome = () => {
    setNewHome(!newHome);
  };

  /......................./;

  const payMonth = {
    January: "unpaid",
    February: "unpaid",
    March: "unpaid",
    April: "unpaid",
  };
  // Get the current month index
  const currentMonthIndex = new Date().getMonth();
  // Get all months in order
  const monthNames = Object.keys(payMonth);

  const countUnpaidMonths = () => {
    let unpaidCount = 0;
    for (let i = 0; i <= currentMonthIndex; i++) {
      if (payMonth[monthNames[i]] === "unpaid") {
        unpaidCount++;
      }
    }
    return unpaidCount;
  };

  useEffect(() => {
    setUnpaidMonthsCount(countUnpaidMonths());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // console.log(unpaidMonthsCount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const Name = form.NameEn.value;
    const NameBn = form.NameBn.value;
    const Number = form.Number.value;
    const HomeName = form.HomeName.value;
    const Due = 0;
    const Tarabi = {
      fee: 0,
      status: "unpaid",
      active: false,
    };
    const FeeRate = 0;
    const PayMonths = [
      {
        monthName: "January",
        status: "unpaid",
      },
      {
        monthName: "February",
        status: "unpaid",
      },
      {
        monthName: "March",
        status: "unpaid",
      },
      {
        monthName: "April",
        status: "unpaid",
      },
      {
        monthName: "May",
        status: "unpaid",
      },
      {
        monthName: "June",
        status: "unpaid",
      },
      {
        monthName: "July",
        status: "unpaid",
      },
      {
        monthName: "August",
        status: "unpaid",
      },
      {
        monthName: "September",
        status: "unpaid",
      },
      {
        monthName: "October",
        status: "unpaid",
      },
      {
        monthName: "November",
        status: "unpaid",
      },
      {
        monthName: "December",
        status: "unpaid",
      },
    ];

    const user = {
      Name,
      NameBn,
      Number,
      HomeName,
      Due,
      Tarabi,
      FeeRate,
      PayMonths,
    };

    // send data to the server
    const addUser = await axiosPublic.post("/addUser", user);
    if (addUser.data.insertedId) {
      Swal.fire({
        title: "Congrats!",
        text: `${user.NameBn}কে অ্যাড করা হয়েছে!`,
        icon: "success",
        confirmButtonText: "Ok",
      });
    } else {
      Swal.fire({
        icon: "error",
        text: `${user.NameBn} আগে থেকে অ্যাড আছেন`,
        showConfirmButton: false,
        timer: 800,
      });
    }
  };

  return (
    <div className="min-h-screen mx-auto space-y-2 md:max-w-80 mt-14">
      <form onSubmit={handleSubmit}>
        <div className="px-1 mx-auto space-y-1 form-control md:w-96 w-72">
          <input
            type="text"
            name="NameEn"
            placeholder="নাম ইংরেজীতে "
            required
            className="w-full input input-bordered"
          />

          <input
            type="text"
            name="NameBn"
            placeholder="নাম বাংলায়"
            required
            className="w-full input input-bordered"
          />
          <input
            type="text"
            name="Number"
            placeholder="নাম্বার 01**"
            className="w-full input input-bordered"
          />
          <p className="text-right">
            <button type="button" onClick={toggleNewHome}>
              <small className="underline">
                {newHome ? "পুরাতন বাড়ি?" : "নতুন বাড়ি?"}
              </small>
            </button>
          </p>

          {newHome ? (
            <input
              type="text"
              name="HomeName"
              placeholder="বাড়ির নাম বাংলায়"
              required
              className="w-full input input-bordered"
            />
          ) : (
            <select className="w-full select select-bordered " name="HomeName">
              <option disabled selected>
                বাড়ির নাম
              </option>
              {homeName.map((home) => (
                <option key={home}>{home}</option>
              ))}
            </select>
          )}
        </div>
        <div className="mt-2 text-center md:w-96 ">
          <input
            type="submit"
            value="অ্যাড করুন"
            className="btn btn-outline btn-info"
          />
        </div>
      </form>
    </div>
  );
};

export default AddUser;
