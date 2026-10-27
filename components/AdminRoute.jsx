"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { PageLoader } from "./Loader";

const AdminRoute = ({ children }) => {
  const [isAdmin, isAdminLoading] = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) router.replace("/adminSignin");
  }, [isAdminLoading, isAdmin, router]);

  if (isAdminLoading) return <PageLoader label="যাচাই করা হচ্ছে" />;
  if (isAdmin) return children;
  return null;
};

export default AdminRoute;
