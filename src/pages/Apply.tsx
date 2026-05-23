import MemberForm, { MemberFormData } from "./Index";
import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMemberTypeFromSearch } from "@/lib/member";

const Apply = () => {
  const location = useLocation();
  const memberType = useMemo(() => getMemberTypeFromSearch(location.search), [location.search]);

  if (!memberType) {
    return <Navigate to="/" replace />;
  }

  const initialData: Partial<MemberFormData> = {
    memberType,
    memberNumber: "",
  };

  return <MemberForm initialData={initialData} mode="apply" />;
};

export default Apply;
