import { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export const FormSection = ({ title, children, className = "" }: FormSectionProps) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 pb-3 border-b-2 border-primary">
        {title}
      </h2>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
