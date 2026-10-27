"use client";
import useSession from "./useSession";

const useAdmin = () => {
  const { me, isPending } = useSession();
  return [me?.admin === true, isPending];
};
export default useAdmin;
