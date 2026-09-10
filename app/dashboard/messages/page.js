"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import useAxiosPublic from "@/hooks/useAxiosPublic";
import useHomeName from "@/hooks/useHomeName";
import useNumbers from "@/hooks/useNumbers";

const MessagesPage = () => {
  const axiosPublic = useAxiosPublic();
  const [homeName] = useHomeName();
  const [numbers] = useNumbers();

  const [mode, setMode] = useState("single"); // "single" | "all"

  const [selectedHome, setSelectedHome] = useState("");
  const [names, setNames] = useState([]);
  const [selectedNameId, setSelectedNameId] = useState("");
  const [loadingNames, setLoadingNames] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [customNumbers, setCustomNumbers] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["sms-balance"],
    queryFn: async () => {
      const res = await axiosPublic.get("/check-balance");
      return res.data;
    },
  });

  const handleHomeChange = async (e) => {
    const home = e.target.value;
    setSelectedHome(home);
    setSelectedNameId("");
    setSelectedUser(null);
    setNames([]);
    if (!home) return;
    setLoadingNames(true);
    try {
      const res = await axiosPublic.get(`/usersName/${home}`);
      setNames(res.data || []);
    } catch {
      setNames([]);
    } finally {
      setLoadingNames(false);
    }
  };

  const handleNameChange = async (e) => {
    const id = e.target.value;
    setSelectedNameId(id);
    if (!id) return;
    setLoadingUser(true);
    try {
      const res = await axiosPublic.get(`/user/${id}`);
      setSelectedUser(res.data);
    } catch {
      setSelectedUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const parsedCustomNumbers = customNumbers
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter((n) => /^\d{11}$/.test(n));

  const handleSend = async () => {
    if (!message.trim()) return;

    if (mode === "single") {
      if (!selectedUser?.Number) {
        Swal.fire({ icon: "error", title: "কোনো নাম্বার পাওয়া যায়নি" });
        return;
      }
      const confirm = await Swal.fire({
        title: "নিশ্চিত করুন",
        html: `<b>${selectedUser.NameBn}</b> (${selectedUser.Number}) কে মেসেজ পাঠানো হবে।`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "পাঠান",
        cancelButtonText: "বাতিল",
      });
      if (!confirm.isConfirmed) return;

      setSending(true);
      try {
        await axiosPublic.post("/sms", {
          number: selectedUser.Number,
          message: `${message} 
                    -ইসলামপুর জামে মসজিদ`,
        });
        Swal.fire({ icon: "success", title: "মেসেজ পাঠানো হয়েছে" });
        setMessage("");
      } catch {
        Swal.fire({ icon: "error", title: "পাঠাতে ব্যর্থ হয়েছে" });
      } finally {
        setSending(false);
      }
      return;
    }

    if (mode === "custom") {
      if (parsedCustomNumbers.length === 0) {
        Swal.fire({ icon: "error", title: "সঠিক নাম্বার দিন" });
        return;
      }
      const confirm = await Swal.fire({
        title: "নিশ্চিত করুন",
        html: `<b>${parsedCustomNumbers.length}</b> টি নাম্বারে মেসেজ পাঠানো হবে।`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "পাঠান",
        cancelButtonText: "বাতিল",
      });
      if (!confirm.isConfirmed) return;

      setSending(true);
      try {
        const res = await axiosPublic.post("/sms/bulk", {
          message: `${message} 
                    -ইসলামপুর জামে মসজিদ`,
          numbers: parsedCustomNumbers,
        });
        Swal.fire({
          icon: "success",
          title: "পাঠানো শেষ",
          html: `মোটঃ ${res.data.total}<br/>সফলঃ ${res.data.sent}<br/>ব্যর্থঃ ${res.data.failed.length}`,
        });
        setMessage("");
        setCustomNumbers("");
      } catch {
        Swal.fire({ icon: "error", title: "পাঠাতে ব্যর্থ হয়েছে" });
      } finally {
        setSending(false);
      }
      return;
    }

    // mode === "all"
    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `মোট <b>${numbers.length}</b> জন সদস্যকে মেসেজ পাঠানো হবে। এটি বাতিল করা যাবে না।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, সবাইকে পাঠান",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    setSending(true);
    try {
      const res = await axiosPublic.post("/sms/bulk", {
        message: `${message} 
                    -ইসলামপুর জামে মসজিদ`,
      });
      Swal.fire({
        icon: "success",
        title: "পাঠানো শেষ",
        html: `মোটঃ ${res.data.total}<br/>সফলঃ ${res.data.sent}<br/>ব্যর্থঃ ${res.data.failed.length}`,
      });
      setMessage("");
    } catch {
      Swal.fire({ icon: "error", title: "পাঠাতে ব্যর্থ হয়েছে" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl p-4 mx-auto">
      <h1 className="mb-1 text-xl font-bold">মেসেজ পাঠান</h1>
      {balance !== undefined && (
        <p className="mb-4 text-sm text-gray-500">
          SMS ব্যালেন্সঃ {balance?.balance ?? "লোড হচ্ছে..."}
        </p>
      )}

      <div className="mb-4 tabs tabs-boxed w-fit">
        <button
          className={`tab ${mode === "single" ? "tab-active" : ""}`}
          onClick={() => setMode("single")}
        >
          নির্দিষ্ট সদস্য
        </button>
        <button
          className={`tab ${mode === "custom" ? "tab-active" : ""}`}
          onClick={() => setMode("custom")}
        >
          যেকোনো নাম্বার
        </button>
        <button
          className={`tab ${mode === "all" ? "tab-active" : ""}`}
          onClick={() => setMode("all")}
        >
          সব সদস্য
        </button>
      </div>

      {mode === "single" && (
        <div className="mb-4 space-y-3">
          <select
            value={selectedHome}
            onChange={handleHomeChange}
            className="w-full select select-bordered"
          >
            <option value="" disabled>
              বাড়ি বাছাই করুন
            </option>
            {homeName.map((home) => (
              <option key={home} value={home}>
                {home}
              </option>
            ))}
          </select>

          {selectedHome && (
            <select
              value={selectedNameId}
              onChange={handleNameChange}
              className="w-full select select-bordered"
              disabled={loadingNames}
            >
              <option value="" disabled>
                {loadingNames ? "লোড হচ্ছে..." : "নাম বাছাই করুন"}
              </option>
              {names.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.NameBn}
                </option>
              ))}
            </select>
          )}

          {loadingUser && <p className="text-sm text-gray-400">লোড হচ্ছে...</p>}

          {selectedUser && (
            <p className="text-sm text-gray-500">
              নাম্বারঃ {selectedUser.Number || "নাম্বার নেই"}
            </p>
          )}
        </div>
      )}

      {mode === "custom" && (
        <div className="mb-4 space-y-2">
          <textarea
            value={customNumbers}
            onChange={(e) => setCustomNumbers(e.target.value)}
            placeholder="নাম্বার লিখুন - একাধিক হলে কমা বা নতুন লাইনে দিন&#10;যেমনঃ 01712345678, 01898765432"
            rows={3}
            className="w-full textarea textarea-bordered"
          />
          <p className="text-xs text-gray-500">
            {parsedCustomNumbers.length > 0
              ? `${parsedCustomNumbers.length} টি সঠিক নাম্বার পাওয়া গেছে`
              : "১১ ডিজিটের নাম্বার দিন (যেমনঃ 017...)"}
          </p>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="মেসেজ লিখুন..."
        rows={5}
        className="w-full mb-4 textarea textarea-bordered"
      />

      <button
        onClick={handleSend}
        disabled={
          sending ||
          !message.trim() ||
          (mode === "single" && !selectedUser?.Number) ||
          (mode === "custom" && parsedCustomNumbers.length === 0)
        }
        className="w-full btn btn-info disabled:opacity-50"
      >
        {sending
          ? "পাঠানো হচ্ছে..."
          : mode === "single"
            ? "পাঠান"
            : mode === "custom"
              ? `পাঠান (${parsedCustomNumbers.length} জন)`
              : `সবাইকে পাঠান (${numbers.length} জন)`}
      </button>
    </div>
  );
};

export default MessagesPage;
