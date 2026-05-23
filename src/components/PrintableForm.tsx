import React from "react";
import type { MemberFormData } from "@/pages/Index";
import { FAMILY_SUBTYPE_LABELS, MEMBER_TYPE_LABELS } from "@/lib/member";

interface PrintableFormProps {
  formData: MemberFormData;
}

const genderMap: Record<string, string> = {
  male: "男",
  female: "女",
};

const educationMap: Record<string, string> = {
  "01": "未受教育",
  "02": "小學",
  "03": "中學",
  "04": "專上",
  "05": "其他",
};

const employmentStatusMap: Record<string, string> = {
  "01": "全職",
  "02": "兼職",
  "03": "失業",
  "04": "退休",
  "05": "其他",
};

const employmentTypeMap: Record<string, string> = {
  full: "全職",
  part: "兼職",
  temp: "臨時工",
  self: "自僱",
};

const housingStatusMap: Record<string, string> = {
  "01": "公屋",
  "02": "劏房",
  "03": "天台屋",
  "04": "私樓",
  "05": "其他",
};

const maritalStatusMap: Record<string, string> = {
  single: "單身",
  married: "已婚",
  divorced: "離異",
  widowed: "喪偶",
};

const assistanceMap: Record<string, string> = {
  yes: "是",
  no: "否",
};

const displayValue = (value: string) => value || "—";

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3
    style={{
      fontSize: "12pt",
      fontWeight: 700,
      borderBottom: "2px solid #1f2937",
      paddingBottom: "4px",
      margin: "0 0 10px 0",
    }}
  >
    {children}
  </h3>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <tr>
    <td style={{ width: "35%", fontWeight: 700, padding: "4px 0", verticalAlign: "top" }}>{label}</td>
    <td style={{ padding: "4px 0" }}>{displayValue(value)}</td>
  </tr>
);

const DeclarationBlock = () => (
  <div style={{ marginBottom: "15px" }}>
    <SectionTitle>聲明</SectionTitle>
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "14px 16px",
        backgroundColor: "#f9fafb",
      }}
    >
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, marginBottom: "4px" }}>(A) 申請人聲明</div>
        <div>本人聲明以上資料均為真實及正確，並同意按機構要求提供相關證明文件。</div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 700, marginBottom: "4px" }}>(B) 資料用途</div>
        <div>本表格資料將用作內部記錄及服務跟進用途。</div>
      </div>
      <div>
        <div style={{ fontWeight: 700, marginBottom: "4px" }}>(C) 同意條款</div>
        <div>本人同意機構就本次申請處理及保存上述資料。</div>
      </div>
    </div>

    <div
      style={{
        marginTop: "12px",
        padding: "12px 14px",
        border: "1px solid #111827",
        borderRadius: "8px",
        fontWeight: 700,
      }}
    >
      本人已閱讀並同意上述聲明內容。<span style={{ color: "#dc2626" }}>*</span>
    </div>
  </div>
);

export const PrintableForm: React.FC<PrintableFormProps> = ({ formData }) => {
  const memberTypeLabel =
    MEMBER_TYPE_LABELS[formData.memberType] +
    (formData.memberType === "family" && formData.familyMemberSubtype
      ? ` / ${FAMILY_SUBTYPE_LABELS[formData.familyMemberSubtype]}`
      : "");

  const childNames = formData.childrenNames.map((name) => name.trim()).filter(Boolean);
  const assistanceTypes =
    formData.assistanceTypes.includes("其他") && formData.assistanceOther
      ? [
          ...formData.assistanceTypes.filter((type) => type !== "其他"),
          `其他(${formData.assistanceOther})`,
        ]
      : formData.assistanceTypes;

  return (
    <div
      style={{
        width: "180mm",
        minHeight: "297mm",
        padding: "10mm",
        backgroundColor: "white",
        color: "black",
        fontFamily: '"Microsoft JhengHei", "Noto Sans TC", sans-serif',
        fontSize: "11pt",
        lineHeight: "1.55",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <h1 style={{ fontSize: "18pt", fontWeight: 700, margin: "0 0 6px 0", color: "#111827" }}>
          會員申請表
        </h1>
        <h2 style={{ fontSize: "14pt", fontWeight: 700, margin: 0, color: "#374151" }}>{memberTypeLabel}</h2>
      </div>

      <div
        style={{
          marginBottom: "15px",
          padding: "8px 10px",
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
        }}
      >
        <span style={{ fontWeight: 700 }}>會員編號：</span>
        <span>{displayValue(formData.memberNumber)}</span>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <SectionTitle>個人資料</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <tbody>
            <Row label="中文姓名" value={formData.chineseName} />
            <Row label="英文姓名" value={formData.englishName} />
            <Row label="性別" value={genderMap[formData.gender] || formData.gender} />
            <Row label="出生日期" value={formatDate(formData.birthDate)} />
            <Row label="身份證號碼" value={formData.idNumber} />
            <Row label="電話號碼" value={formData.phone} />
            <Row label="住宅電話" value={formData.homePhone} />
            <Row label="通訊地址" value={formData.address} />
            <Row label="婚姻狀況" value={maritalStatusMap[formData.maritalStatus] || formData.maritalStatus} />
            {formData.maritalStatus === "married" && <Row label="配偶姓名" value={formData.spouseName} />}
            <Row
              label="是否有子女同住"
              value={
                formData.childrenLivingTogether === "yes"
                  ? "有"
                  : formData.childrenLivingTogether === "no"
                    ? "沒有"
                    : ""
              }
            />
            {formData.childrenLivingTogether === "yes" && (
              <Row label="子女姓名" value={childNames.join("、")} />
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <SectionTitle>家庭及就業狀況</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <tbody>
            <Row label="教育程度" value={educationMap[formData.education] || formData.education} />
            <Row label="專業技能" value={formData.professionalSkills} />
            <Row label="職業" value={formData.occupation} />
            <Row label="就業情況" value={employmentStatusMap[formData.employmentStatus] || formData.employmentStatus} />
            {(formData.employmentStatus === "01" || formData.employmentStatus === "02") && (
              <>
                <Row label="受僱類型" value={employmentTypeMap[formData.employmentType] || formData.employmentType} />
                <Row label="每月薪金" value={formData.monthlySalary} />
              </>
            )}
            <Row label="家庭總人數" value={formData.householdSize} />
            <Row label="家庭每月總收入" value={formData.householdIncome} />
            <Row
              label="住屋性質"
              value={
                formData.housingStatus === "05"
                  ? `其他${formData.housingStatusOther ? ` (${formData.housingStatusOther})` : ""}`
                  : housingStatusMap[formData.housingStatus] || formData.housingStatus
              }
            />
            <Row label="每月住屋開支" value={formData.monthlyHousingExpense} />
            <Row label="是否領取援助" value={assistanceMap[formData.receivingAssistance] || formData.receivingAssistance} />
            {formData.receivingAssistance === "yes" && (
              <Row label="援助類別" value={assistanceTypes.join("、")} />
            )}
          </tbody>
        </table>
      </div>

      <DeclarationBlock />

      <div style={{ marginTop: "15px" }}>
        <SectionTitle>簽署</SectionTitle>
        <table style={{ width: "100%", tableLayout: "fixed" }}>
          <tbody>
            <tr>
              <td style={{ width: "60%", verticalAlign: "top" }}>
                <p style={{ fontWeight: 700, margin: "0 0 6px 0" }}>申請人簽署</p>
                {formData.signature && (
                  <img
                    src={formData.signature}
                    alt="申請人簽署"
                    style={{
                      maxWidth: "180px",
                      maxHeight: "70px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "4px",
                    }}
                  />
                )}
              </td>
              <td style={{ width: "40%", verticalAlign: "top", textAlign: "right" }}>
                <p style={{ fontWeight: 700, margin: "0 0 6px 0" }}>日期</p>
                <p style={{ margin: 0 }}>{displayValue(formatDate(formData.signatureDate))}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
