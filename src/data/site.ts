export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const siteConfig = {
  name: "Safar Tours",
  fullName: "Safar Tours & Travels",
  legalName: "Safar Tours & Travels",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://safartour.in",
  phone: "+917001588581",
  phoneDisplay: "+91 70015 88581",
  altPhone: "+919144113147",
  altPhoneDisplay: "+91 91441 13147",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "917001588581",
  email: "enquiry@safartour.in",
  address: {
    street: "NJP Main Road, Bhaktinagar",
    city: "Siliguri",
    postalCode: "734007",
    state: "West Bengal",
    country: "India",
  },
  hours: [
    { days: "Monday – Saturday", time: "9:00 AM – 8:00 PM" },
    { days: "Sunday", time: "10:00 AM – 6:00 PM" },
  ],
  social: {
    facebook: "https://www.facebook.com/safarsikkim17/",
    instagram: "https://www.instagram.com/safartoursandtravals/",
  },
} as const;

/**
 * Why-choose-us content now lives beside the component that renders it
 * (src/components/sections/WhyChooseUs.tsx) — removed the unused exports
 * (stats / howItWorks) so this file stays purely navigational + business info.
 */

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Packages", href: "/packages" },
  { label: "Car Rentals", href: "/car-rentals" },
  { label: "Destinations", href: "/#destinations" },
  { label: "Travel Guides", href: "/guides" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact" },
];

export const footerExplore = [
  { label: "Darjeeling", href: "/packages/darjeeling" },
  { label: "Sikkim", href: "/packages/sikkim" },
  { label: "Kalimpong", href: "/packages/kalimpong" },
  { label: "Dooars", href: "/packages/dooars" },
  { label: "Meghalaya", href: "/packages/meghalaya" },
  { label: "Arunachal Pradesh", href: "/packages/arunachal-pradesh" },
] as const;
