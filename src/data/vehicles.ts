export type Vehicle = {
  slug: string;
  name: string;
  category: string;
  models: string[];
  capacity: string;
  luggage?: string;
  description: string;
  image: string;
  imageAlt: string;
  features: string[];
  availableFor: string[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const vehicles: Vehicle[] = [
  {
    slug: "suv",
    name: "SUV",
    category: "SUV",
    models: ["Mahindra Bolero", "Maruti Ertiga"],
    capacity: "6 Passengers",
    luggage: "3–4 bags",
    description:
      "The dependable hill workhorse — rugged, comfortable and proven on the steep switchbacks of Sikkim and North Bengal.",
    image: u("photo-1533473359331-0135ef1b58bf"),
    imageAlt: "SUV driving on a winding hill road",
    features: [
      "Experienced hill driver",
      "High ground clearance for mountain roads",
      "Music system & charging points",
      "Comfortable seating for full-day drives",
    ],
    availableFor: [
      "Family tours",
      "Airport & station transfers",
      "Multi-day hill tours",
      "Sightseeing",
    ],
  },
  {
    slug: "luxury-suv",
    name: "Luxury SUV",
    category: "Luxury SUV",
    models: ["Toyota Innova Crysta", "Mahindra XUV"],
    capacity: "6–7 Passengers",
    luggage: "4–5 bags",
    description:
      "Extra comfort and space for longer journeys — ideal for families who want the most relaxed ride from Bagdogra to the hills and back.",
    image: u("photo-1519641471654-76ce0107ad1b"),
    imageAlt: "Premium SUV parked at a mountain viewpoint",
    features: [
      "Push-back captain seats (Crysta)",
      "Powerful AC for summer plains",
      "Ample luggage space",
      "Best-in-class ride comfort",
    ],
    availableFor: [
      "Family tours",
      "Long-distance travel",
      "Corporate travel",
      "Airport transfers",
    ],
  },
  {
    slug: "economy-suv",
    name: "Economy SUV",
    category: "Economy SUV",
    models: ["Maruti Ertiga", "Renault Triber"],
    capacity: "6 Passengers",
    luggage: "2–3 bags",
    description:
      "Budget-friendly comfort for small groups — the most economical way to do the hills with a private vehicle and driver.",
    image: u("photo-1549317661-bd32c8ce0db2"),
    imageAlt: "Compact SUV on a scenic road",
    features: [
      "Fuel-efficient",
      "Great value for small groups",
      "Experienced driver",
      "Comfortable for short and mid-range routes",
    ],
    availableFor: [
      "Budget tours",
      "Small family transfers",
      "Sightseeing",
      "Station transfers",
    ],
  },
  {
    slug: "hatchback",
    name: "Hatchback",
    category: "Hatchback",
    models: ["Maruti Swift", "Hyundai i10"],
    capacity: "4 Passengers",
    luggage: "2 bags",
    description:
      "Nimble and economical — a smart pick for couples on short transfers and town sightseeing.",
    image: u("photo-1502877338535-766e1452684a"),
    imageAlt: "Compact hatchback car on a road",
    features: [
      "Most economical option",
      "Easy parking in hill towns",
      "Air-conditioned",
      "Ideal for couples",
    ],
    availableFor: ["Couples' transfers", "Town sightseeing", "Short routes"],
  },
  {
    slug: "sedan",
    name: "Sedan",
    category: "Sedan",
    models: ["Maruti Dzire", "Honda Amaze"],
    capacity: "4 Passengers",
    luggage: "3 bags",
    description:
      "A comfortable balance of economy and comfort — popular for airport transfers and Darjeeling–Kalimpong circuits.",
    image: u("photo-1541899481282-d53bffe3c35d"),
    imageAlt: "Sedan car on a highway",
    features: [
      "Smooth highway comfort",
      "Generous boot space",
      "Air-conditioned",
      "Professional driver",
    ],
    availableFor: [
      "Airport transfers",
      "Couples & small families",
      "Point-to-point routes",
    ],
  },
  {
    slug: "tempo-traveller",
    name: "Tempo Traveller",
    category: "Tempo Traveller",
    models: ["Force Tempo Traveller 12/17-seater"],
    capacity: "12–17 Passengers",
    luggage: "Roof carrier + rear space",
    description:
      "The group-travel favourite — push-back seats, headroom for the hills and room for everyone's luggage.",
    image: u("photo-1544620347-c4fd4a3d5957"),
    imageAlt: "Tempo traveller parked at a mountain viewpoint",
    features: [
      "Push-back seats",
      "High roof with standing headroom",
      "Large luggage carrier",
      "Perfect for group departures",
    ],
    availableFor: [
      "Group tours",
      "Corporate outings",
      "Pilgrimage groups",
      "School & college trips",
    ],
  },
  {
    slug: "bus",
    name: "Bus",
    category: "Bus",
    models: ["27–35 seater coaches"],
    capacity: "27–35 Passengers",
    luggage: "Full under-belly storage",
    description:
      "Large-group movement made simple — coaches for big family functions, pilgrimages and institutional tours.",
    image: u("photo-1570125909232-eb263c188f7e"),
    imageAlt: "Coach bus on a highway journey",
    features: [
      "Large group capacity",
      "Under-belly luggage bay",
      "Comfortable push-back seating",
      "Experienced long-route driver",
    ],
    availableFor: [
      "Large group tours",
      "Weddings & events",
      "Pilgrimages",
      "Institutional travel",
    ],
  },
];

export function getVehicle(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}
