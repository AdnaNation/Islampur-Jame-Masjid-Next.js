"use client";

import { useState } from "react";

const Notification = () => {
  const [notification, setNotification] = useState(true);
  const ShowHideNotification = () => {
    setNotification(!notification);
  };
  return (
    <>
      {notification && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-md flex justify-between items-center shadow-md">
          <p className="text-sm">The site for the member of Islampur society</p>
          <button
            onClick={ShowHideNotification}
            className="text-yellow-800 hover:text-yellow-600 focus:outline-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default Notification;
