export const CRM_STATUSES = [
  { value: 'new', label: 'New', color: 'neutral', description: 'New enquiry received' },
  { value: 'contacted', label: 'Contacted', color: 'blue', description: 'First contact made' },
  { value: 'requirement_collected', label: 'Requirement Collected', color: 'blue', description: 'Customer requirements documented' },
  { value: 'quotation_preparing', label: 'Quotation Preparing', color: 'amber', description: 'Quotation being prepared' },
  { value: 'quotation_sent', label: 'Quotation Sent', color: 'purple', description: 'Quotation sent to customer' },
  { value: 'negotiation', label: 'Negotiation', color: 'amber', description: 'Negotiating with customer' },
  { value: 'booking_pending', label: 'Booking Pending', color: 'green', description: 'Booking being processed' },
  { value: 'booked', label: 'Booked', color: 'green', description: 'Booking confirmed' },
  { value: 'trip_ongoing', label: 'Trip Ongoing', color: 'green', description: 'Trip in progress' },
  { value: 'completed', label: 'Completed', color: 'green', description: 'Trip completed' },
  { value: 'lost', label: 'Lost', color: 'red', description: 'Lead lost' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray', description: 'Trip cancelled' },
] as const;

export const CRM_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const CRM_LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Call' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'ads', label: 'Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'google', label: 'Google' },
  { value: 'google_business', label: 'Google Business Profile' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'existing_customer', label: 'Existing Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_DESTINATIONS = [
  'Darjeeling',
  'Sikkim',
  'Gangtok',
  'North Sikkim',
  'Kalimpong',
  'Dooars',
  'Pelling',
  'Meghalaya',
  'Arunachal Pradesh',
  'Bhutan',
  'Custom / Other',
] as const;

export const CRM_TRIP_TYPES = [
  { value: 'package', label: 'Package' },
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'hotel_transport', label: 'Hotel + Transport' },
  { value: 'custom_trip', label: 'Custom Trip' },
  { value: 'airport_transfer', label: 'Airport Transfer' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'family_holiday', label: 'Family Holiday' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_GROUP_TYPES = [
  { value: 'family', label: 'Family' },
  { value: 'couple', label: 'Couple' },
  { value: 'group', label: 'Group' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'solo', label: 'Solo' },
  { value: 'friends', label: 'Friends' },
  { value: 'senior_citizens', label: 'Senior Citizens' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_MEAL_PLANS = [
  { value: 'EP', label: 'EP', full: 'European Plan (no meals)' },
  { value: 'CP', label: 'CP', full: 'Continental Plan (Breakfast)' },
  { value: 'MAP', label: 'MAP', full: 'Modified American Plan (Breakfast + Dinner)' },
  { value: 'AP', label: 'AP', full: 'American Plan (Breakfast + Lunch + Dinner)' },
] as const;

export const CRM_HOTEL_CATEGORIES = [
  'Budget',
  'Standard',
  '2 Star Deluxe',
  '2 Star Premium',
  '3 Star Deluxe',
  '3 Star Premium',
  '4 Star Deluxe',
  '4 Star Premium',
  '5 Star',
  'Boutique',
  'Homestay',
  'Resort',
  'Customer Choice',
] as const;

export const CRM_VEHICLES = [
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'innova', label: 'Innova' },
  { value: 'innova_crysta', label: 'Innova Crysta' },
  { value: 'luxury_suv', label: 'Luxury SUV' },
  { value: 'tempo_traveller', label: 'Tempo Traveller' },
  { value: 'bus', label: 'Bus' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_FOLLOWUP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_LOST_REASONS = [
  { value: 'price_too_high', label: 'Price too high' },
  { value: 'changed_plan', label: 'Changed travel plan' },
  { value: 'another_agency', label: 'Chose another agency' },
  { value: 'no_response', label: 'No response' },
  { value: 'dates_unavailable', label: 'Dates unavailable' },
  { value: 'destination_changed', label: 'Destination changed' },
  { value: 'duplicate_enquiry', label: 'Duplicate enquiry' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_DOCUMENT_TYPES = [
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'permit', label: 'Permit' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'hotel_voucher', label: 'Hotel Voucher' },
  { value: 'payment_receipt', label: 'Payment Receipt' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'itinerary', label: 'Itinerary' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_SUPPLIER_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'driver', label: 'Driver' },
  { value: 'vehicle_owner', label: 'Vehicle Owner' },
  { value: 'transport_company', label: 'Transport Company' },
  { value: 'local_agent', label: 'Local Agent' },
  { value: 'activity_provider', label: 'Activity Provider' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_COMMUNICATION_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
] as const;

export const CRM_QUOTATION_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'neutral' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'viewed', label: 'Viewed', color: 'blue' },
  { value: 'revised', label: 'Revised', color: 'amber' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'expired', label: 'Expired', color: 'gray' },
] as const;

export const CRM_TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const;

export const CRM_TRIP_STATUSES_FOR_BOOKING = ['booked', 'trip_ongoing', 'completed'] as const;

export const CRM_ACTIVE_STATUSES = [
  'new', 'contacted', 'requirement_collected', 'quotation_preparing',
  'quotation_sent', 'negotiation', 'booking_pending', 'booked', 'trip_ongoing',
] as const;

export const CRM_PIPE_SEPARATOR = '|';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function parsePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function calculatePax(adults: number, childrenBelow5: number, children5_12: number, childrenAbove12: number, infants: number): number {
  return adults + childrenBelow5 + children5_12 + childrenAbove12 + infants;
}

export function calculateNights(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateDuration(startDate: string | null, endDate: string | null): { nights: number; days: number } {
  const nights = calculateNights(startDate, endDate);
  return { nights, days: nights + 1 };
}

export function generateTripReference(): string {
  const year = new Date().getFullYear();
  return `ST-${year}-00001`;
}

export function generateQuotationReference(): string {
  const year = new Date().getFullYear();
  return `QT-${year}-00001`;
}

export function getStatusColor(status: string): string {
  const statusConfig = CRM_STATUSES.find(s => s.value === status);
  if (!statusConfig) return 'neutral';

  const colors: Record<string, string> = {
    neutral: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-500',
  };

  return colors[statusConfig.color] || colors.neutral;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-amber-100 text-amber-600',
    urgent: 'bg-red-100 text-red-600',
  };
  return colors[priority] || colors.medium;
}
