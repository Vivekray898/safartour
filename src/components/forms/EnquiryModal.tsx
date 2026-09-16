"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import EnquiryForm from "@/components/forms/EnquiryForm";

export default function EnquiryModal({
  label,
  title = "Plan Your Trip with Safar Tours",
  subtitle = "Tell us just a little about your trip. We'll help you plan the rest.",
  variant = "primary",
  size = "lg",
  className = "",
  initialValues,
}: {
  label: string;
  title?: string;
  subtitle?: string;
  variant?: "primary" | "secondary" | "whatsapp" | "outline";
  size?: "md" | "lg";
  className?: string;
  initialValues?: { destination?: string; package?: string };
}) {
  const [open, setOpen] = useState(false);

  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary",
    secondary:
      "bg-secondary text-white hover:bg-secondary-dark focus-visible:outline-secondary",
    whatsapp:
      "bg-[#25D366] text-white hover:bg-[#1da851] focus-visible:outline-[#1da851]",
    outline:
      "border border-border bg-transparent text-foreground hover:border-primary hover:text-primary focus-visible:outline-primary",
  } as const;
  const sizeClasses = {
    md: "px-4 sm:px-5 py-2 sm:py-2.5 text-sm",
    lg: "px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base",
  } as const;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="enquiry-modal-title">
        <div className="p-5 sm:p-7">
          <h2
            id="enquiry-modal-title"
            className="font-display text-xl font-bold text-foreground"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {subtitle}
          </p>
          <div className="mt-5">
            <EnquiryForm
              compact
              initialValues={initialValues}
              onSuccess={() => {}}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
