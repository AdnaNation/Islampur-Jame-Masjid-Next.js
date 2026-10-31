import { MdGroups } from "react-icons/md";
import PageBanner from "@/components/PageBanner";

export default function FeeLayout({ children }) {
  return (
    <>
      <PageBanner
        title="চাঁদার তালিকা"
        subtitle="সদস্যদের মাসিক চাঁদা"
        icon={<MdGroups className="mx-auto mb-1 text-3xl text-amber-300" />}
      />
      {children}
    </>
  );
}
