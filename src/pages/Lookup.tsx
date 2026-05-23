import React, { useState } from "react";
import MemberForm, { MemberFormData } from "./Index";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = `http://${window.location.hostname}:3001/api`;

const Lookup = () => {
  const { toast } = useToast();
  const [idNumber, setIdNumber] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<MemberFormData> | null>(null);

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!idNumber.trim() && !memberNumber.trim()) {
      toast({
        title: "請輸入身份證號碼或會員編號",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookup-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber, memberNumber }),
      });

      if (!response.ok) {
        throw new Error("Member not found");
      }

      const data = await response.json();
      setInitialData(data.data || {});
    } catch (error) {
      console.error("Lookup error:", error);
      toast({
        title: "找不到會員資料",
        description: "請確認輸入的資料是否正確。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (initialData) {
    return <MemberForm initialData={initialData} mode="lookup" />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-card rounded-lg shadow-lg p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">舊會員查詢</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            請輸入身份證號碼或會員編號，再載入會員資料。
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idNumber" className="text-base">
              身份證號碼
            </Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(event) => setIdNumber(event.target.value)}
              className="text-base"
              placeholder="例如 A123456(7)"
            />
          </div>

          <div className="space-y-2 text-center text-muted-foreground">
            <span>或</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberNumber" className="text-base">
              會員編號
            </Label>
            <Input
              id="memberNumber"
              value={memberNumber}
              onChange={(event) => setMemberNumber(event.target.value)}
              className="text-base"
              placeholder="例如 G001"
            />
          </div>

          <Button type="submit" className="w-full text-lg py-5" disabled={isLoading}>
            {isLoading ? "查詢中..." : "查詢"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Lookup;
