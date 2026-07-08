"use client";

const userProfile = {
  picture:
    "https://miro.medium.com/v2/resize:fit:360/1*jZ9v-2QShwnfCwHlEZCmDw.png",
  name: "John Doe",
  status: "Active",
  pendingBills: 120.5,
  paidBills: 560.0,
  lastLogin: "2025-01-22",
  totalTransactions: 8,
};

const Profile = () => {
  const profile = userProfile;
  return (
    <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-6 space-y-4">
      {/* Profile Picture */}
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-24 h-24 rounded-full border-2 border-blue-500 shadow-sm"
          src={profile?.picture}
          alt={`${profile.name}'s profile`}
        />
      </div>

      {/* Name and Member Status */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-gray-800">{profile.name}</h2>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            profile.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {profile.status}
        </span>
      </div>

      {/* Pending and Paid Bills */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Pending Bills:</span>
          <span className="font-medium text-red-600">
            ${profile.pendingBills}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Paid Bills:</span>
          <span className="font-medium text-green-600">
            ${profile.paidBills}
          </span>
        </div>
      </div>

      {/* Additional Features */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Last Login:</span>
          <span className="text-gray-800">{profile.lastLogin}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Transactions:</span>
          <span className="font-medium text-blue-600">
            {profile.totalTransactions}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={() => alert("Viewing details...")}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default Profile;
