"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TbFidgetSpinner } from "react-icons/tb";
import useAdmin from "@/hooks/useAdmin";
import { getLocalStorage } from "@/lib/localStorage";

const AdminRoute = ({ children }) => {
  const [isAdmin, isAdminLoading] = useAdmin();
  const number = getLocalStorage("Number");
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoading && !(number && isAdmin)) {
      router.replace("/adminSignin");
    }
  }, [isAdminLoading, isAdmin, number, router]);

  if (isAdminLoading) {
    return (
      <div>
        <TbFidgetSpinner className="text-4xl mx-auto text-center animate-spin" />
      </div>
    );
  }

  if (number && isAdmin) {
    return children;
  }

  // Redirecting via the effect above; render nothing in the meantime.
  return null;
};

export default AdminRoute;
