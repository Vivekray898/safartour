import { siteConfig } from "@/data/site";

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function generalEnquiryMessage(): string {
  return `Hello ${siteConfig.name},

I would like to plan a trip.

Destination:
Travel date:
Travellers:
Duration:

Please share a quote. Thank you!`;
}

export function packageEnquiryMessage(
  packageTitle: string,
  duration: string
): string {
  return `Hello ${siteConfig.name},

I am interested in the "${packageTitle}" (${duration}).

Travel date:
Travellers:
Duration: ${duration}

Please share a quote. Thank you!`;
}

export function vehicleEnquiryMessage(vehicleName: string): string {
  return `Hello ${siteConfig.name},

I would like to enquire about a ${vehicleName} rental.

Pickup location:
Drop location:
Date & time:

Please share current fare details. Thank you!`;
}

export function routeEnquiryMessage(
  from: string,
  to: string
): string {
  return `Hello ${siteConfig.name},

I need a taxi from ${from} to ${to}.

Date & time:
Passengers:
Vehicle preference:

Please share current fare. Thank you!`;
}

export function phoneHref(): string {
  return `tel:${siteConfig.phone}`;
}
