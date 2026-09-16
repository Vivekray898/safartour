import { z } from "zod";
import { isFormType } from "@/config/forms";

/**
 * Lead schema — shared by the client form and the /api/leads route so
 * validation rules never drift apart.
 *
 * One schema for all form types; `formType` decides where the lead is
 * stored (Google Sheet tab / email subject), not which rules apply.
 */
export const leadSchema = z.object({
  /** Which form the lead came from — decides the Google Sheet tab. */
  formType: z
    .string()
    .default("tour")
    .refine(isFormType, "Unknown form type."),
  /** Page the form was on (context for the admin). */
  page: z.string().trim().max(300).optional().default(""),

  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .regex(
      /^[+\d][\d\s-]{7,15}$/,
      "Please enter a valid phone number."
    ),
  email: z
    .union([
      z.literal(""),
      z.string().trim().email("Please enter a valid email address."),
    ])
    .optional()
    .transform((v) => v ?? ""),
  destination: z.string().trim().min(1, "Please select your destination."),
  /** Approximate travel start date (optional, free text or ISO date). */
  travelDate: z.union([z.literal(""), z.string().trim().max(60)]).optional().default(""),
  travellers: z
    .union([
      z.string().trim().min(1, "Please select number of travellers."),
      z.number().positive().transform((n) => String(n)),
    ])
    .default("2"),
  /** Package or vehicle name, captured as context when available. */
  package: z.string().trim().max(200).optional().default(""),
  message: z
    .string()
    .trim()
    .max(2000, "Message is too long.")
    .optional()
    .default(""),
  // Honeypot — humans leave it empty. NOT validated here on purpose: the API
  // route checks it and returns a fake success so bots don't retry.
  website: z.string().optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Formats a zod error into a field -> message map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
