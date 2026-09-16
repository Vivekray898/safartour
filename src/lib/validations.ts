import { z } from "zod";

export const enquirySchema = z.object({
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
    .union([z.literal(""), z.string().trim().email("Please enter a valid email address.")])
    .optional()
    .transform((v) => v ?? ""),
  destination: z.string().trim().min(1, "Please select your destination."),
  arrivalDate: z.union([z.literal(""), z.string()]).optional().default(""),
  departureDate: z.union([z.literal(""), z.string()]).optional().default(""),
  travellers: z
    .union([
      z.string().trim().min(1, "Please select number of travellers."),
      z.number().positive().transform((n) => String(n)),
    ])
    .default("2"),
  package: z.string().trim().max(200).optional().default(""),
  message: z
    .string()
    .trim()
    .max(2000, "Message is too long.")
    .optional()
    .default(""),
  // Honeypot — must stay empty (bots fill it)
  website: z.literal("", { message: "Spam detected." }).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Formats a zod error into a field -> message map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
