import { site } from '@/config/site';
import type { SessionUser } from './auth';

export function getWhatsAppBaseUrl(): string {
  return `https://wa.me/${site.whatsapp}`;
}

export function getCustomerWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
}

export function generateLeadFollowUpMessage(
  customerName: string,
  tripRef: string,
  destination: string,
  employee: SessionUser,
  followUpType: string
): string {
  const employeeName = employee.name;

  const messages: Record<string, string> = {
    call: `Hello ${customerName}, this is ${employeeName} from Safar Tours. I'm calling regarding your ${destination} trip enquiry (${tripRef}). Please let me know a convenient time to discuss your requirements.`,
    whatsapp: `Hello ${customerName}, this is ${employeeName} from Safar Tours regarding your ${destination} trip enquiry (${tripRef}). I wanted to follow up and see if you have any questions. Looking forward to hearing from you!`,
    email: `Subject: Following up on your ${destination} trip enquiry (${tripRef})

Hello ${customerName},

This is ${employeeName} from Safar Tours. I'm following up on your ${destination} trip enquiry (${tripRef}).

Please let me know if you have any questions or if you'd like to proceed with booking.

Best regards,
${employeeName}
Safar Tours`,
    meeting: `Hello ${customerName}, this is ${employeeName} from Safar Tours. I'd like to schedule a meeting to discuss your ${destination} trip enquiry (${tripRef}) in detail. Please let me know your availability.`,
    other: `Hello ${customerName}, this is ${employeeName} from Safar Tours regarding your ${destination} trip enquiry (${tripRef}).`,
  };

  return messages[followUpType] || messages.other;
}

export function generateQuotationSentMessage(
  customerName: string,
  tripRef: string,
  destination: string,
  quotationRef: string,
  amount: number,
  validUntil: string
): string {
  return `Hello ${customerName}, thank you for considering Safar Tours for your ${destination} trip!

We've prepared a quotation (${quotationRef}) for your trip (${tripRef}):
Total: ₹${amount.toLocaleString()}
Valid until: ${validUntil}

Please review and let us know if you'd like to proceed or if you have any questions.

Best regards,
Safar Tours Team`;
}

export function generateBookingConfirmationMessage(
  customerName: string,
  tripRef: string,
  destination: string,
  startDate: string,
  endDate: string,
  pax: number
): string {
  return `Dear ${customerName},

Congratulations! Your trip has been confirmed.

Trip Reference: ${tripRef}
Destination: ${destination}
Travel Dates: ${startDate} to ${endDate}
Number of Travellers: ${pax}

We're excited to host you! Our team will contact you closer to your travel date with more details.

If you have any questions in the meantime, feel free to reach out.

Best regards,
Safar Tours Team`;
}

export function generatePaymentReminderMessage(
  customerName: string,
  tripRef: string,
  destination: string,
  pendingAmount: number,
  dueDate: string
): string {
  return `Hello ${customerName}, this is a gentle reminder regarding your ${destination} trip (${tripRef}).

Pending Amount: ₹${pendingAmount.toLocaleString()}
Due Date: ${dueDate}

Please make the payment at your earliest convenience to confirm your booking. You can pay via:
- Cash
- UPI
- Bank Transfer
- Card

Let us know if you have any questions!

Best regards,
Safar Tours Team`;
}

export function generateTripCompletionMessage(
  customerName: string,
  tripRef: string,
  destination: string,
  employee: SessionUser
): string {
  return `Dear ${customerName},

We hope you had a wonderful time on your ${destination} trip (${tripRef})!

We'd love to hear about your experience. If you have a moment, please share your feedback - it helps us serve you better on future trips.

It was a pleasure hosting you. We look forward to welcoming you again soon!

Best regards,
${employee.name}
Safar Tours Team`;
}

export function generateIncompleteLeadReminder(
  customerName: string,
  tripRef: string,
  destination: string
): string {
  return `Hello ${customerName}, thank you for your interest in Safar Tours!

We received your enquiry for ${destination} trip (${tripRef}) but we're missing some details to prepare a complete quotation.

Could you please share:
- Preferred travel dates
- Number of travellers
- Budget range
- Any specific requirements

Looking forward to helping you plan your trip!

Best regards,
Safar Tours Team`;
}

export function generateWhatsAppPreFilledMessage(
  customerName: string,
  tripRef: string,
  message: string
): string {
  return `Hello ${customerName}, regarding your trip ${tripRef}:

${message}`;
}
