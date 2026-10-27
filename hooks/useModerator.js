"use client";
import useSession from "./useSession";

const useModerator = () => {
  const { me, isPending } = useSession();
  return [me?.moderator === true, isPending];
};
export default useModerator;
