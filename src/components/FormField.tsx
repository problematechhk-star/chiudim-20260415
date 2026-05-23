import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
  note?: string;
}

export const FormField = ({ label, required = false, children, error, note }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base md:text-lg font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {note && <span className="text-muted-foreground text-sm ml-2">({note})</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};
