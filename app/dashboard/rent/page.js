"use client";

import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const ShopRent = () => {
  const axiosPublic = useAxiosPublic();
  const [id, setId] = useState(null);
  const {
    data: shopKeepers = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["shopKeeper"],
    queryFn: async () => await axiosPublic.get(`/shopKeeper`),
  });
  const { data: seller = [] } = useQuery({
    queryKey: [id],
    enabled: !!id,
    queryFn: async () => await axiosPublic.get(`/shopKeeper/${id}`),
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const Name = form.NameEn.value;
    const NameBn = form.NameBn.value;
    const Number = form.Number.value;
    const Rent = form.Rent.value;
    const Due = 0;

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
      Rent,
      Due,
      PayMonths,
    };
    // send data to the server
    const addUser = await axiosPublic.post("/addShopKeeper", user);
    if (addUser.data.insertedId) {
      refetch();
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

  const handleClick = (id) => {
    setId(id);
  };
  return (
    <div className="min-h-screen ">
      <div>
        <h3 className="my-3 text-xl font-bold text-center">
          দোকান ভাড়ার তালিকা
        </h3>

        <div className="overflow-x-auto">
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th></th>
                <th>নাম ও নাম্বার</th>
                <th>ভাড়া</th>
                <th>বকেয়া</th>
              </tr>
            </thead>
            <tbody>
              {shopKeepers?.data?.map((shopKeeper, index) => (
                <tr
                  onClick={() => handleClick(shopKeeper._id)}
                  key={shopKeeper._id}
                >
                  <th>{index + 1}</th>
                  <td>{shopKeeper.NameBn}</td>
                  <td>{shopKeeper.Rent}</td>
                  <td>{shopKeeper.Due}</td>
                </tr>
              ))}
            </tbody>
            {isPending && <p>Loading....</p>}
          </table>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <h4 className="font-semibold text-center mt-10n">
            নতুন দোকানদার অ্যাড করুন
          </h4>
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
              name="Rent"
              placeholder="ভাড়ার পরিমান ইংরেজীতে"
              required
              className="w-full input input-bordered"
            />
            <input
              type="text"
              name="Number"
              placeholder="নাম্বার 01**"
              className="w-full input input-bordered"
            />
          </div>
          <div className="mt-2 text-center ">
            <input
              type="submit"
              value="অ্যাড করুন"
              className="btn btn-outline btn-info"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopRent;
