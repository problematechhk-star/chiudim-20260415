import React, { useEffect, useState } from "react";
import { FormSection } from "@/components/FormSection";
import { FormField } from "@/components/FormField";
import { SignaturePad } from "@/components/SignaturePad";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  FAMILY_SUBTYPE_LABELS,
  MEMBER_TYPE_LABELS,
  type FamilySubtype,
  type MemberType,
} from "@/lib/member";

const API_BASE_URL = `http://${window.location.hostname}:3001/api`;

export interface MemberFormData {
  entryMode: MemberFormMode;
  originalMemberNumber: string;
  memberType: MemberType;
  familyMemberSubtype: FamilySubtype | "";
  memberNumber: string;
  chineseName: string;
  englishName: string;
  gender: string;
  birthDate: string;
  idNumber: string;
  phone: string;
  homePhone: string;
  address: string;
  education: string;
  professionalSkills: string;
  occupation: string;
  employmentStatus: string;
  employmentType: string;
  monthlySalary: string;
  householdSize: string;
  householdIncome: string;
  housingStatus: string;
  housingStatusOther: string;
  monthlyHousingExpense: string;
  maritalStatus: string;
  spouseName: string;
  childrenLivingTogether: string;
  childrenNames: string[];
  receivingAssistance: string;
  assistanceTypes: string[];
  assistanceOther: string;
  signature: string;
  signatureDate: string;
  agreeToTerms: boolean;
}

export type MemberFormMode = "apply" | "lookup";

interface MemberFormProps {
  initialData?: Partial<MemberFormData>;
  mode?: MemberFormMode;
}

const DEFAULT_FORM_DATA: MemberFormData = {
  entryMode: "apply",
  originalMemberNumber: "",
  memberType: "general",
  familyMemberSubtype: "",
  memberNumber: "",
  chineseName: "",
  englishName: "",
  gender: "",
  birthDate: "",
  idNumber: "",
  phone: "",
  homePhone: "",
  address: "",
  education: "",
  professionalSkills: "",
  occupation: "",
  employmentStatus: "",
  employmentType: "",
  monthlySalary: "",
  householdSize: "",
  householdIncome: "",
  housingStatus: "",
  housingStatusOther: "",
  monthlyHousingExpense: "",
  maritalStatus: "",
  spouseName: "",
  childrenLivingTogether: "",
  childrenNames: [""],
  receivingAssistance: "",
  assistanceTypes: [],
  assistanceOther: "",
  signature: "",
  signatureDate: new Date().toISOString().split("T")[0],
  agreeToTerms: false,
};

const educationOptions = [
  { value: "01", label: "未受教育" },
  { value: "02", label: "小學" },
  { value: "03", label: "中學" },
  { value: "04", label: "專上" },
  { value: "05", label: "其他" },
];

const employmentOptions = [
  { value: "01", label: "全職" },
  { value: "02", label: "兼職" },
  { value: "03", label: "失業" },
  { value: "04", label: "退休" },
  { value: "05", label: "其他" },
];

const employmentTypeOptions = [
  { value: "full", label: "全職" },
  { value: "part", label: "兼職" },
  { value: "temp", label: "臨時工" },
  { value: "self", label: "自僱" },
];

const housingOptions = [
  { value: "01", label: "公屋" },
  { value: "02", label: "劏房" },
  { value: "03", label: "天台屋" },
  { value: "04", label: "私樓" },
  { value: "05", label: "其他" },
];

const maritalStatusOptions = [
  { value: "single", label: "單身" },
  { value: "married", label: "已婚" },
  { value: "divorced", label: "離異" },
  { value: "widowed", label: "喪偶" },
];

const assistanceOptions = [
  "長者生活津貼",
  "生果金",
  "傷殘津貼",
  "綜援",
  "學生資助",
  "交通津貼",
  "租金津貼",
  "其他",
];

const cleanChildrenNames = (names: any) => {
  if (!Array.isArray(names)) return [""];
  const trimmed = names.map((name) => String(name || "").trim());
  const nonEmpty = trimmed.filter(Boolean);
  return nonEmpty.length > 0 ? nonEmpty : [""];
};

const MemberForm = ({ initialData, mode = "apply" }: MemberFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MemberFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
    childrenNames: cleanChildrenNames(
      initialData?.childrenNames ?? DEFAULT_FORM_DATA.childrenNames
    ),
    assistanceTypes: Array.isArray(initialData?.assistanceTypes)
      ? initialData!.assistanceTypes
      : DEFAULT_FORM_DATA.assistanceTypes,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
      childrenNames: cleanChildrenNames(
        initialData.childrenNames ?? prev.childrenNames
      ),
      assistanceTypes: Array.isArray(initialData.assistanceTypes)
        ? initialData.assistanceTypes
        : prev.assistanceTypes,
    }));
  }, [initialData]);

  const handleInputChange = <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }));
    }
  };

  const handleAssistanceTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      assistanceTypes: prev.assistanceTypes.includes(type)
        ? prev.assistanceTypes.filter((item) => item !== type)
        : [...prev.assistanceTypes, type],
    }));
  };

  const updateChildName = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      childrenNames: prev.childrenNames.map((name, currentIndex) =>
        currentIndex === index ? value : name
      ),
    }));
    if (errors.childrenNames) {
      setErrors((prev) => ({ ...prev, childrenNames: "" }));
    }
  };

  const addChildName = () => {
    setFormData((prev) => ({ ...prev, childrenNames: [...prev.childrenNames, ""] }));
  };

  const removeChildName = (index: number) => {
    setFormData((prev) => {
      const next = prev.childrenNames.filter((_, currentIndex) => currentIndex !== index);
      return { ...prev, childrenNames: next.length > 0 ? next : [""] };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chineseName.trim()) newErrors.chineseName = "請填寫中文姓名。";
    if (!formData.gender) newErrors.gender = "請選擇性別。";
    if (!formData.birthDate) newErrors.birthDate = "請填寫出生日期。";
    if (!formData.idNumber.trim()) newErrors.idNumber = "請填寫身份證號碼。";
    if (!formData.phone.trim()) {
      newErrors.phone = "請填寫電話號碼。";
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = "電話號碼只可輸入數字。";
    }
    if (!formData.address.trim()) newErrors.address = "請填寫通訊地址。";
    if (!formData.householdSize) newErrors.householdSize = "請填寫家庭總人數。";
    if (!formData.householdIncome) newErrors.householdIncome = "請填寫家庭每月總收入。";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "請閱讀並同意聲明。";
    if (!formData.signature) newErrors.signature = "請簽署。";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      toast({
        title: "表格尚未填妥",
        description: newErrors[firstErrorField],
        variant: "destructive",
      });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload: MemberFormData = {
      ...formData,
      entryMode: mode,
      originalMemberNumber:
        mode === "lookup" ? formData.originalMemberNumber || formData.memberNumber : "",
      spouseName: formData.maritalStatus === "married" ? formData.spouseName.trim() : "",
      childrenNames:
        formData.childrenLivingTogether === "yes"
          ? formData.childrenNames.map((name) => name.trim()).filter(Boolean)
          : [],
      familyMemberSubtype: mode === "lookup" ? formData.familyMemberSubtype : "",
    };

    sessionStorage.setItem("pendingFormData", JSON.stringify(payload));
    navigate("/staff");
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:3001/`);
      if (!response.ok) throw new Error("Server unavailable");
      toast({
        title: "連線成功",
        description: "已成功連接後端伺服器。",
      });
    } catch (error) {
      console.error("Connection test failed:", error);
      toast({
        variant: "destructive",
        title: "連線失敗",
        description: "請檢查後端服務（server.cjs）是否正在執行。",
      });
    }
  };

  const showSalaryFields = formData.employmentStatus === "01" || formData.employmentStatus === "02";
  const memberTypeLabel = MEMBER_TYPE_LABELS[formData.memberType];
  const familySubtypeLabel =
    formData.familyMemberSubtype && formData.memberType === "family"
      ? ` (${FAMILY_SUBTYPE_LABELS[formData.familyMemberSubtype]})`
      : "";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={testConnection}>
            測試連線
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-6 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary mb-3">入會申請表</h1>
            <h2 className="text-xl md:text-3xl font-semibold text-foreground mb-2">
              {mode === "lookup" ? "舊會員資料更新" : memberTypeLabel}
              {familySubtypeLabel}
            </h2>
            <p className="text-muted-foreground">
              會員編號會在職員頁面產生，請先完成申請人資料。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormField label="會員編號" note="職員頁面產生">
              <Input value={formData.memberNumber} className="text-base md:text-lg" disabled />
            </FormField>

            <FormSection title="個人資料">
              <FormField label="中文姓名" required error={errors.chineseName}>
                <Input
                  value={formData.chineseName}
                  onChange={(event) => handleInputChange("chineseName", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入中文姓名"
                />
              </FormField>

              <FormField label="英文姓名">
                <Input
                  value={formData.englishName}
                  onChange={(event) => handleInputChange("englishName", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入英文姓名"
                />
              </FormField>

              <FormField label="性別" required error={errors.gender}>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" className="h-5 w-5" />
                    <Label htmlFor="male" className="text-base md:text-lg cursor-pointer">
                      男
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" className="h-5 w-5" />
                    <Label htmlFor="female" className="text-base md:text-lg cursor-pointer">
                      女
                    </Label>
                  </div>
                </RadioGroup>
              </FormField>

              <FormField label="出生日期" required error={errors.birthDate}>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(event) => handleInputChange("birthDate", event.target.value)}
                  className="text-base md:text-lg"
                />
              </FormField>

              <FormField label="身份證號碼" required error={errors.idNumber}>
                <Input
                  value={formData.idNumber}
                  onChange={(event) => handleInputChange("idNumber", event.target.value)}
                  className="text-base md:text-lg"
                  maxLength={20}
                  placeholder="請輸入身份證號碼"
                />
              </FormField>

              <FormField label="電話號碼" required error={errors.phone}>
                <Input
                  value={formData.phone}
                  onChange={(event) => handleInputChange("phone", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入電話號碼"
                />
              </FormField>

              <FormField label="住宅電話">
                <Input
                  value={formData.homePhone}
                  onChange={(event) => handleInputChange("homePhone", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入住宅電話"
                />
              </FormField>

              <FormField label="通訊地址" required error={errors.address}>
                <Textarea
                  value={formData.address}
                  onChange={(event) => handleInputChange("address", event.target.value)}
                  className="text-base md:text-lg min-h-24"
                  placeholder="請輸入通訊地址"
                />
              </FormField>

              <FormField label="婚姻狀況" error={errors.maritalStatus}>
                <RadioGroup
                  value={formData.maritalStatus}
                  onValueChange={(value) => {
                    handleInputChange("maritalStatus", value);
                    if (value !== "married") {
                      handleInputChange("spouseName", "");
                    }
                  }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {maritalStatusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`marital-${option.value}`}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`marital-${option.value}`}
                        className="text-base md:text-lg cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormField>

              {formData.maritalStatus === "married" && (
                <FormField label="配偶姓名" error={errors.spouseName}>
                  <Input
                    value={formData.spouseName}
                    onChange={(event) => handleInputChange("spouseName", event.target.value)}
                    className="text-base md:text-lg"
                    placeholder="請輸入配偶姓名"
                  />
                </FormField>
              )}

              <FormField label="是否有子女同住" error={errors.childrenLivingTogether}>
                <RadioGroup
                  value={formData.childrenLivingTogether}
                  onValueChange={(value) => {
                    handleInputChange("childrenLivingTogether", value);
                    if (value !== "yes") {
                      handleInputChange("childrenNames", [""]);
                    }
                  }}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="children-yes" className="h-5 w-5" />
                    <Label htmlFor="children-yes" className="text-base md:text-lg cursor-pointer">
                      有
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="children-no" className="h-5 w-5" />
                    <Label htmlFor="children-no" className="text-base md:text-lg cursor-pointer">
                      沒有
                    </Label>
                  </div>
                </RadioGroup>
              </FormField>

              {formData.childrenLivingTogether === "yes" && (
                <FormField label="子女姓名" error={errors.childrenNames}>
                  <div className="space-y-3">
                    {formData.childrenNames.map((name, index) => (
                      <div key={index} className="flex gap-3">
                        <Input
                          value={name}
                          onChange={(event) => updateChildName(index, event.target.value)}
                          className="text-base md:text-lg"
                          placeholder={`請輸入子女姓名 ${index + 1}`}
                        />
                        {formData.childrenNames.length >= 2 && (
                          <Button type="button" variant="outline" onClick={() => removeChildName(index)}>
                            刪除
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addChildName}>
                      新增子女姓名
                    </Button>
                  </div>
                </FormField>
              )}
            </FormSection>

            <FormSection title="家庭及就業狀況">
              <FormField label="教育程度">
                <RadioGroup
                  value={formData.education}
                  onValueChange={(value) => handleInputChange("education", value)}
                  className="space-y-3"
                >
                  {educationOptions.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={level.value}
                        id={`education-${level.value}`}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`education-${level.value}`}
                        className="text-base md:text-lg cursor-pointer"
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormField>

              <FormField label="專業技能">
                <Input
                  value={formData.professionalSkills}
                  onChange={(event) => handleInputChange("professionalSkills", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入專業技能"
                />
              </FormField>

              <FormField label="職業">
                <Input
                  value={formData.occupation}
                  onChange={(event) => handleInputChange("occupation", event.target.value)}
                  className="text-base md:text-lg"
                  placeholder="請輸入職業"
                />
              </FormField>

              <FormField label="就業情況">
                <RadioGroup
                  value={formData.employmentStatus}
                  onValueChange={(value) => {
                    handleInputChange("employmentStatus", value);
                    if (value !== "01" && value !== "02") {
                      handleInputChange("employmentType", "");
                      handleInputChange("monthlySalary", "");
                    }
                  }}
                  className="space-y-3"
                >
                  {employmentOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`employment-${option.value}`}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`employment-${option.value}`}
                        className="text-base md:text-lg cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showSalaryFields && (
                  <div className="ml-8 mt-4 space-y-4 p-4 bg-muted rounded-md">
                    <Label className="text-base md:text-lg font-medium">受僱類型</Label>
                    <RadioGroup
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange("employmentType", value)}
                      className="space-y-3"
                    >
                      {employmentTypeOptions.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={type.value}
                            id={`emp-type-${type.value}`}
                            className="h-5 w-5"
                          />
                          <Label
                            htmlFor={`emp-type-${type.value}`}
                            className="text-base md:text-lg cursor-pointer"
                          >
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </FormField>

              {showSalaryFields && (
                <FormField label="每月薪金">
                  <Input
                    type="number"
                    value={formData.monthlySalary}
                    onChange={(event) => handleInputChange("monthlySalary", event.target.value)}
                    className="text-base md:text-lg"
                    min="0"
                    placeholder="請輸入每月薪金"
                  />
                </FormField>
              )}

              <FormField label="家庭總人數" required error={errors.householdSize}>
                <Input
                  type="number"
                  value={formData.householdSize}
                  onChange={(event) => handleInputChange("householdSize", event.target.value)}
                  className="text-base md:text-lg"
                  min="1"
                  placeholder="請輸入家庭總人數"
                />
              </FormField>

              <FormField label="家庭每月總收入" required error={errors.householdIncome}>
                <Input
                  type="number"
                  value={formData.householdIncome}
                  onChange={(event) => handleInputChange("householdIncome", event.target.value)}
                  className="text-base md:text-lg"
                  min="0"
                  placeholder="請輸入家庭每月總收入"
                />
              </FormField>

              <FormField label="住屋性質">
                <RadioGroup
                  value={formData.housingStatus}
                  onValueChange={(value) => {
                    handleInputChange("housingStatus", value);
                    if (value !== "05") {
                      handleInputChange("housingStatusOther", "");
                    }
                  }}
                  className="space-y-3"
                >
                  {housingOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`housing-${option.value}`}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`housing-${option.value}`}
                        className="text-base md:text-lg cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {formData.housingStatus === "05" && (
                  <Input
                    value={formData.housingStatusOther}
                    onChange={(event) => handleInputChange("housingStatusOther", event.target.value)}
                    className="text-base md:text-lg mt-3"
                    placeholder="請輸入住屋性質"
                  />
                )}
              </FormField>

              <FormField label="每月住屋開支">
                <Input
                  type="number"
                  value={formData.monthlyHousingExpense}
                  onChange={(event) => handleInputChange("monthlyHousingExpense", event.target.value)}
                  className="text-base md:text-lg"
                  min="0"
                  placeholder="請輸入每月住屋開支"
                />
              </FormField>

              <FormField label="是否領取援助">
                <RadioGroup
                  value={formData.receivingAssistance}
                  onValueChange={(value) => {
                    handleInputChange("receivingAssistance", value);
                    if (value !== "yes") {
                      handleInputChange("assistanceTypes", []);
                      handleInputChange("assistanceOther", "");
                    }
                  }}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="assistance-yes" className="h-5 w-5" />
                    <Label htmlFor="assistance-yes" className="text-base md:text-lg cursor-pointer">
                      是
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="assistance-no" className="h-5 w-5" />
                    <Label htmlFor="assistance-no" className="text-base md:text-lg cursor-pointer">
                      否
                    </Label>
                  </div>
                </RadioGroup>

                {formData.receivingAssistance === "yes" && (
                  <div className="ml-8 mt-4 space-y-3 p-4 bg-muted rounded-md">
                    <Label className="text-base md:text-lg font-medium">援助類別</Label>
                    {assistanceOptions.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assistance-${type}`}
                          checked={formData.assistanceTypes.includes(type)}
                          onCheckedChange={() => handleAssistanceTypeToggle(type)}
                          className="h-5 w-5"
                        />
                        <Label
                          htmlFor={`assistance-${type}`}
                          className="text-base md:text-lg cursor-pointer"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                    {formData.assistanceTypes.includes("其他") && (
                      <Input
                        value={formData.assistanceOther}
                        onChange={(event) => handleInputChange("assistanceOther", event.target.value)}
                        className="text-base md:text-lg mt-3"
                        placeholder="請輸入其他援助類別"
                      />
                    )}
                  </div>
                )}
              </FormField>
            </FormSection>

            <FormSection title="聲明">
              <div className="space-y-4 text-base md:text-lg leading-relaxed bg-muted p-6 rounded-md">
                <div>
                  <h3 className="font-semibold mb-2">(A) 申請人聲明</h3>
                  <p className="text-muted-foreground">
                    本人聲明以上資料均為真實及正確，並同意按機構要求提供相關證明文件。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">(B) 資料用途</h3>
                  <p className="text-muted-foreground">
                    本表格資料將用作內部記錄及服務跟進用途。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">(C) 同意條款</h3>
                  <p className="text-muted-foreground">
                    本人同意機構就本次申請處理及保存上述資料。
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-accent/10 rounded-md">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", Boolean(checked))}
                  className="h-6 w-6 mt-1"
                />
                <Label
                  htmlFor="agreeToTerms"
                  className="text-base md:text-lg cursor-pointer leading-relaxed"
                >
                  本人已閱讀並同意上述聲明內容。
                  <span className="text-destructive ml-1">*</span>
                </Label>
              </div>
              {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms}</p>}
            </FormSection>

            <FormSection title="申請人簽署">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField label="申請人簽署" required error={errors.signature}>
                  <SignaturePad
                    onSignatureChange={(signature) => handleInputChange("signature", signature)}
                    error={errors.signature}
                  />
                </FormField>

                <FormField label="日期" required>
                  <Input
                    type="date"
                    value={formData.signatureDate}
                    onChange={(event) => handleInputChange("signatureDate", event.target.value)}
                    className="text-base md:text-lg"
                  />
                </FormField>
              </div>
            </FormSection>

            <div className="pt-6 border-t border-border">
              <Button type="submit" className="w-full text-lg py-6">
                下一步（職員資料）
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberForm;
