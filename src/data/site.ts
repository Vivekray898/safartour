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
 * Marketing stats are UNVERIFIED.
 * Confirm real figures with the business owner before launch —
 * items marked `confirmed: false` render without implying hard numbers.
 */
export const stats = [
  { value: "5000+", label: "Happy Travellers", confirmed: false },
  { value: "Multiple", label: "Destinations Across Northeast India", confirmed: true },
  { value: "Diverse", label: "Fleet of Vehicles", confirmed: true },
  { value: "24/7", label: "Travel Support", confirmed: true },
] as const;

export type Stat = (typeof stats)[number];

export const whyChooseUs = [
  {
    title: "Local Destination Knowledge",
    description:
      "Based in Siliguri, we know the hills, the roads and the seasons — and we plan routes that make the most of your time.",
    icon: "map",
  },
  {
    title: "Reliable Transportation",
    description:
      "Well-maintained vehicles with experienced hill drivers who know every bend from Bagdogra to North Sikkim.",
    icon: "car",
  },
  {
    title: "Customised Itineraries",
    description:
      "Every trip is built around your dates, budget and pace — no fixed departures, no crowded coaches.",
    icon: "route",
  },
  {
    title: "Dedicated Travel Support",
    description:
      "A reachable team before and during your trip, with support on call throughout your journey.",
    icon: "headset",
  },
  {
    title: "Comfortable Stays",
    description:
      "Handpicked hotels and homestays that match your budget and expectations — vetted, not guessed.",
    icon: "bed",
  },
  {
    title: "Transparent Planning",
    description:
      "Clear itineraries and clear quotes. You'll know exactly what is included before you confirm.",
    icon: "fileText",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    title: "Tell Us Your Plan",
    description:
      "Share your destination, dates and group size through the enquiry form, WhatsApp or a phone call.",
    icon: "message",
  },
  {
    step: "02",
    title: "Get Your Itinerary",
    description:
      "We prepare a tailored itinerary with stays, sightseeing and transport — and refine it with you.",
    icon: "map",
  },
  {
    step: "03",
    title: "Confirm Your Trip",
    description:
      "Happy with the plan? Confirm with a simple booking advance and we handle the rest.",
    icon: "check",
  },
  {
    step: "04",
    title: "Enjoy Your Journey",
    description:
      "Arrive, meet your driver and travel with a team that stays reachable throughout your trip.",
    icon: "mountain",
  },
] as const;

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Packages",
    href: "/packages",
    children: [
      { label: "Sikkim", href: "/packages/sikkim" },
      { label: "Darjeeling", href: "/packages/darjeeling" },
      { label: "Kalimpong", href: "/packages/kalimpong" },
      { label: "Sikkim + Darjeeling", href: "/packages/sikkim-darjeeling" },
      {
        label: "Darjeeling + Kalimpong",
        href: "/packages/darjeeling-kalimpong",
      },
      { label: "Sikkim + Kalimpong", href: "/packages/sikkim-kalimpong" },
    ],
  },
  { label: "Car Rentals", href: "/car-rentals" },
  { label: "Guides", href: "/guides" },
  { label: "About Us", href: "/about-us" },
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
