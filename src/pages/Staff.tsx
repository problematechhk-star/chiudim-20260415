import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { PrintableForm } from "@/components/PrintableForm";
import type { MemberFormData } from "./Index";
import {
  FAMILY_SUBTYPE_LABELS,
  MEMBER_TYPE_LABELS,
  MEMBER_TYPE_PREFIX,
  type FamilySubtype,
} from "@/lib/member";

const API_BASE_URL = `http://${window.location.hostname}:3001/api`;
const SPOUSE_WARNING = "與其他會員姓名重複，請再確認是否重複登記";

const safeFilePart = (value: string) =>
  String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

const appendUniqueRemark = (current: string, remark: string) => {
  const trimmedCurrent = current.trim();
  if (!remark) return trimmedCurrent;
  if (trimmedCurrent.includes(remark)) return trimmedCurrent;
  return trimmedCurrent ? `${trimmedCurrent}\n${remark}` : remark;
};

const Staff = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const printableRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<MemberFormData | null>(null);
  const [staffOwner, setStaffOwner] = useState("");
  const [staffOwnerOther, setStaffOwnerOther] = useState("");
  const [staffRemarks, setStaffRemarks] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [familySubtype, setFamilySubtype] = useState<FamilySubtype | "">("");
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPrintable, setShowPrintable] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingFormData");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as MemberFormData;
      setFormData(parsed);
      setMemberNumber(parsed.memberNumber || "");
      setFamilySubtype(parsed.familyMemberSubtype || "");
    } catch (error) {
      console.error("Failed to parse pending form data:", error);
      setFormData(null);
    }
  }, []);

  useEffect(() => {
    if (!formData || formData.maritalStatus !== "married" || !formData.spouseName.trim()) {
      return;
    }

    let isMounted = true;

    const loadSpouseWarning = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/check-spouse-name`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spouseName: formData.spouseName }),
        });

        if (!response.ok) {
          throw new Error("Failed to check spouse name");
        }

        const data = await response.json();
        if (isMounted && data.match) {
          setStaffRemarks((current) => appendUniqueRemark(current, SPOUSE_WARNING));
        }
      } catch (error) {
        console.error("Spouse name check failed:", error);
      }
    };

    loadSpouseWarning();
    return () => {
      isMounted = false;
    };
  }, [formData]);

  const resolvedMemberTypeLabel = formData ? MEMBER_TYPE_LABELS[formData.memberType] : "";
  const resolvedFamilySubtypeLabel =
    formData?.memberType === "family" && familySubtype ? FAMILY_SUBTYPE_LABELS[familySubtype] : "";

  const resolvedPrefix = formData
    ? formData.memberType === "family"
      ? familySubtype
      : MEMBER_TYPE_PREFIX[formData.memberType]
    : "";

  const printableData =
    formData === null
      ? null
      : {
          ...formData,
          memberNumber,
          familyMemberSubtype: formData.memberType === "family" ? familySubtype : "",
        };

  const generatePDF = async (): Promise<{ localUrl: string } | null> => {
    if (!printableData) return null;

    return new Promise((resolve) => {
      setShowPrintable(true);

      setTimeout(async () => {
        const element = printableRef.current;
        if (!element) {
          console.error("Printable form element not found via ref");
          resolve(null);
          return;
        }

        try {
          console.log("[PDF Generation] Starting capture for", memberNumber);
          const memberPart = safeFilePart(memberNumber || "member");
          const datePart = safeFilePart(
            printableData.signatureDate || new Date().toISOString().split("T")[0]
          );
          const fileName = `application-${memberPart}-${datePart}.pdf`;
          const opt = {
            margin: 0,
            filename: fileName,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: true,
              letterRendering: true,
              allowTaint: true,
            },
            jsPDF: {
              unit: "mm",
              format: "a4",
              orientation: "portrait" as const,
            },
          };

          const worker = html2pdf().set(opt).from(element);
          const pdfBlob = (await worker.outputPdf("blob")) as Blob;
          
          console.log("[PDF Generation] PDF blob created, size:", pdfBlob.size);
          
          if (pdfBlob.size < 2000) {
            console.warn("[PDF Generation] Warning: PDF size is very small, might be empty");
          }

          const uploadFormData = new FormData();
          uploadFormData.append("pdf", pdfBlob, fileName);

          const response = await fetch(`${API_BASE_URL}/save-pdf`, {
            method: "POST",
            body: uploadFormData,
          });

          if (!response.ok) {
            throw new Error("Failed to save PDF to local server");
          }

          const localUrl = URL.createObjectURL(pdfBlob);
          resolve({ localUrl });
        } catch (error) {
          console.error("PDF generation error:", error);
          resolve(null);
        } finally {
          setShowPrintable(false);
        }
      }, 1000);
    });
  };

  const handleGenerateMemberNumber = async () => {
    if (!formData) return;

    if (!resolvedPrefix) {
      toast({
        title: "請先選擇會員類別",
        description: "家庭會員需要先選擇公屋、劏房或新移民未有身份證。",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingId(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/next-member-number?prefix=${encodeURIComponent(resolvedPrefix)}`
      );
      if (!response.ok) {
        throw new Error("Failed to generate member number");
      }

      const data = await response.json();
      setMemberNumber(data.memberNumber || "");
      toast({
        title: "會員編號已產生",
        description: `新會員編號：${data.memberNumber}`,
      });
    } catch (error) {
      console.error("Member number generation failed:", error);
      toast({
        title: "產生會員編號失敗",
        description: "請檢查後端伺服器後再試。",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingId(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData) return;

    if (!memberNumber.trim()) {
      toast({
        title: "請先產生會員編號",
        description: "提交前必須先確認會員編號。",
        variant: "destructive",
      });
      return;
    }

    if (!staffOwner) {
      toast({ title: "請選擇負責同事。", variant: "destructive" });
      return;
    }

    if (staffOwner === "other" && !staffOwnerOther.trim()) {
      toast({ title: "請輸入負責同事姓名。", variant: "destructive" });
      return;
    }

    if (formData.memberType === "family" && !familySubtype) {
      toast({
        title: "請先選擇家庭會員類別",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting form, checking for duplicates...", { idNumber: formData.idNumber, memberNumber });
    try {
      // Check for duplicate ID number before submitting
      const checkResponse = await fetch(`${API_BASE_URL}/check-duplicate-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idNumber: formData.idNumber,
          memberNumber: memberNumber.trim()
        }),
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log("Duplicate check response:", checkData);
        if (checkData.exists) {
          const proceed = window.confirm(
            `發現重複的身份證號碼！\n\n該身份證號碼已存在於 ${
              checkData.source === "CSV" ? "輸出資料庫" : "原始資料庫"
            } 中。\n會員編號：${checkData.memberNumber}\n中文姓名：${
              checkData.chineseName
            }\n\n您確定要繼續提交嗎？`
          );
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      const payload = {
        ...formData,
        memberNumber: memberNumber.trim(),
        familyMemberSubtype: formData.memberType === "family" ? familySubtype : "",
        staffOwner,
        staffOwnerOther: staffOwner === "other" ? staffOwnerOther.trim() : "",
        staffRemarks: staffRemarks.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        const errData = await response.json();
        if (errData.error === "Duplicate ID number") {
          toast({
            title: "身份證號碼重複",
            description: "此身份證號碼已在系統中註冊過，請檢查。",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "會員編號重複",
          description: "請重新產生新的會員編號後再提交。",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to submit form to local server");
      }

      toast({
        title: "正在產生 PDF...",
        description: "請稍候，系統正在建立 PDF。",
      });

      const pdfResult = await generatePDF();
      if (pdfResult) {
        setPdfUrl(pdfResult.localUrl);
      }

      toast({
        title: "提交完成",
        description: "CSV 與 PDF 已成功儲存。",
        className: "bg-success text-success-foreground",
      });

      sessionStorage.removeItem("pendingFormData");
      setSubmitted(true);
      setFormData({
        ...formData,
        memberNumber: memberNumber.trim(),
        familyMemberSubtype: formData.memberType === "family" ? familySubtype : "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "提交失敗",
        description: "請檢查伺服器後再試。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-card rounded-lg shadow-lg p-8 text-center space-y-6">
          <h1 className="text-2xl font-bold text-foreground">沒有可用的表單資料</h1>
          <p className="text-muted-foreground">請先完成新會員或舊會員表單。</p>
          <Button onClick={() => navigate("/")} className="text-lg px-8">
            返回首頁
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 relative">
      <div className="max-w-3xl mx-auto">
        {submitted ? (
          <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-6">
            <div className="mb-6">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">提交成功</h2>
              <p className="text-lg text-muted-foreground mb-6">資料已成功提交並儲存。</p>
              {pdfUrl && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">下載 PDF</p>
                  <a
                    href={pdfUrl}
                    download={`application-${memberNumber || formData.chineseName}-${formData.signatureDate}.pdf`}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    下載 PDF
                  </a>
                </div>
              )}
            </div>
            <Button onClick={() => navigate("/")} className="text-lg px-8">
              返回首頁
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg p-6 md:p-10 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">職員資料</h1>
              <p className="text-muted-foreground text-base md:text-lg">
                請確認會員編號、負責同事及備註。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div>
                  <Label className="text-base">會員類別</Label>
                  <p className="mt-2 text-base text-foreground">
                    {resolvedMemberTypeLabel}
                    {resolvedFamilySubtypeLabel ? ` / ${resolvedFamilySubtypeLabel}` : ""}
                  </p>
                </div>

                {formData.memberType === "family" && (
                  <div className="space-y-3">
                    <Label className="text-base">家庭會員類別</Label>
                    <RadioGroup
                      value={familySubtype}
                      onValueChange={(value) => {
                        setFamilySubtype(value as FamilySubtype);
                        setMemberNumber("");
                      }}
                      className="space-y-3"
                    >
                      {(Object.entries(FAMILY_SUBTYPE_LABELS) as Array<[FamilySubtype, string]>).map(
                        ([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`family-subtype-${value}`} className="h-5 w-5" />
                            <Label htmlFor={`family-subtype-${value}`} className="text-base cursor-pointer">
                              {value} = {label}
                            </Label>
                          </div>
                        )
                      )}
                    </RadioGroup>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-base">會員編號</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input 
                      value={memberNumber} 
                      onChange={(e) => setMemberNumber(e.target.value.toUpperCase())}
                      className="text-base" 
                      placeholder="請輸入或產生會員編號" 
                    />
                    <Button type="button" onClick={handleGenerateMemberNumber} disabled={isGeneratingId}>
                      {isGeneratingId ? "產生中..." : "產生會員編號"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">負責同事</Label>
                <RadioGroup
                  value={staffOwner}
                  onValueChange={(value) => setStaffOwner(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="教牧同工" id="staff-pastoral" className="h-5 w-5" />
                    <Label htmlFor="staff-pastoral" className="text-base cursor-pointer">
                      教牧同工
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="義工" id="staff-volunteer" className="h-5 w-5" />
                    <Label htmlFor="staff-volunteer" className="text-base cursor-pointer">
                      義工
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="staff-other" className="h-5 w-5" />
                    <Label htmlFor="staff-other" className="text-base cursor-pointer">
                      其他
                    </Label>
                  </div>
                </RadioGroup>

                {staffOwner === "other" && (
                  <Input
                    value={staffOwnerOther}
                    onChange={(event) => setStaffOwnerOther(event.target.value)}
                    className="text-base"
                    placeholder="請輸入其他負責同事"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base">備註</Label>
                <Textarea
                  value={staffRemarks}
                  onChange={(event) => setStaffRemarks(event.target.value)}
                  className="text-base min-h-32"
                  placeholder="請輸入備註內容"
                />
              </div>

              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? "送出中..." : "送出"}
              </Button>
            </form>
          </div>
        )}
      </div>

      {showPrintable && printableData && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "210mm",
            backgroundColor: "white",
            zIndex: 9999,
          }}
        >
          <div ref={printableRef}>
            <PrintableForm formData={printableData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
