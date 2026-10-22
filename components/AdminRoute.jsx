"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { getLocalStorage } from "@/lib/localStorage";
import { PageLoader } from "./Loader";

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
    return <PageLoader label="যাচাই করা হচ্ছে" />;
  }

  if (number && isAdmin) {
    return children;
  }

  // Redirecting via the effect above; render nothing in the meantime.
  return null;
};

export default AdminRoute;
