export type MemberType = "general" | "elderly" | "family";
export type FamilySubtype = "P" | "PS" | "PC";

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  general: "一般會員",
  elderly: "長者會員",
  family: "家庭會員",
};

export const FAMILY_SUBTYPE_LABELS: Record<FamilySubtype, string> = {
  P: "公屋",
  PS: "劏房",
  PC: "新移民未有身份證",
};

export const MEMBER_TYPE_PREFIX: Record<Exclude<MemberType, "family">, string> = {
  general: "G",
  elderly: "E",
};

export const getMemberTypeFromSearch = (search: string): MemberType | null => {
  const params = new URLSearchParams(search);
  const type = params.get("type");
  if (type === "general" || type === "elderly" || type === "family") {
    return type;
  }
  return null;
};
