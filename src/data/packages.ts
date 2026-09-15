import type { FAQ } from "@/data/faqs";

export type ItineraryDay = {
  day: number;
  title: string;
  description: string;
  activities: string[];
};

export type TourPackage = {
  slug: string;
  title: string;
  destinationSlug: string;
  duration: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  gallery: { src: string; alt: string }[];
  highlights: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  hotels?: string[];
  /** Set only when the business confirms a starting price. Otherwise "Get Latest Price" is shown. */
  startingPrice?: number;
  bestFor?: string;
  faqs?: FAQ[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const packages: TourPackage[] = [
  {
    slug: "darjeeling-escape-3n4d",
    title: "Darjeeling Escape",
    destinationSlug: "darjeeling",
    duration: "3 Nights / 4 Days",
    description:
      "A compact introduction to Darjeeling — Tiger Hill sunrise, the toy train, tea gardens and the town's colonial charm, with comfortable stays and a private vehicle throughout.",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens above Darjeeling town",
    gallery: [
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Tea gardens on Darjeeling's slopes" },
      { src: u("photo-1593693397690-362cb9666fc2", 1200), alt: "Toy train crossing Batasia Loop" },
      { src: u("photo-1512100356356-de1b84283e18", 1200), alt: "Hillside houses in Darjeeling" },
    ],
    highlights: ["Tiger Hill", "Batasia Loop", "Tea Gardens", "Toy Train", "HMI & Zoo"],
    bestFor: "First-time visitors, families and weekend travellers",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Darjeeling",
        description:
          "Meet our driver at NJP station or Bagdogra airport and wind up into the hills.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Scenic drive to Darjeeling",
          "Hotel check-in",
          "Evening at leisure on Chowk Bazaar / Mall Road",
        ],
      },
      {
        day: 2,
        title: "Tiger Hill Sunrise & Darjeeling Sightseeing",
        description:
          "An early start for the Himalaya's most famous sunrise, then the town's landmarks.",
        activities: [
          "Tiger Hill sunrise over Kanchenjunga",
          "Batasia Loop & Ghoom Monastery",
          "Himalayan Mountaineering Institute & Zoo",
          "Tea garden visit",
        ],
      },
      {
        day: 3,
        title: "Toy Train & Town Exploration",
        description:
          "A heritage train ride and relaxed town day.",
        activities: [
          "Darjeeling Himalayan Railway joy ride",
          "Peace Pagoda",
          "Local market shopping",
          "Café hopping on Mall Road",
        ],
      },
      {
        day: 4,
        title: "Departure",
        description: "Breakfast, checkout and a comfortable transfer back.",
        activities: [
          "Breakfast & checkout",
          "Transfer to NJP / Bagdogra",
        ],
      },
    ],
    inclusions: [
      "Hotel accommodation for 3 nights",
      "Private vehicle for all transfers & sightseeing",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare to NJP or Bagdogra",
      "Lunch and dinner unless specified",
      "Entry fees & toy train tickets",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Darjeeling — confirmed at booking per your budget category"],
    faqs: [
      {
        question: "Is the Tiger Hill trip included?",
        answer:
          "Yes, the sunrise drive to Tiger Hill is part of Day 2 with your private vehicle.",
      },
      {
        question: "When should I book the toy train?",
        answer:
          "Joy-ride seats sell out quickly in season; we recommend booking as early as possible and we can assist with it.",
      },
    ],
  },
  {
    slug: "sikkim-gangtok-getaway-3n4d",
    title: "Sikkim Gangtok Getaway",
    destinationSlug: "sikkim",
    duration: "3 Nights / 4 Days",
    description:
      "Gangtok's highlights in a long weekend — Tsomgo Lake, Baba Mandir, Rumtek Monastery and relaxed evenings on MG Marg.",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Snow peaks above Gangtok, Sikkim",
    gallery: [
      { src: u("photo-1506905925346-21bda4d32df4", 1200), alt: "Snow peaks over Sikkim" },
      { src: u("photo-1573459353208-05d2f14e57d4", 1200), alt: "High-altitude lake near Gangtok" },
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags near Tsomgo Lake" },
    ],
    highlights: ["Tsomgo Lake", "Baba Mandir", "Rumtek Monastery", "MG Marg"],
    bestFor: "Couples, families and first-time Sikkim visitors",
    itinerary: [
      {
        day: 1,
        title: "Arrival at NJP / Bagdogra & Transfer to Gangtok",
        description: "A scenic uphill drive along the Teesta to Sikkim's capital.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Transfer to Gangtok",
          "Hotel check-in",
          "Evening on MG Marg",
        ],
      },
      {
        day: 2,
        title: "Tsomgo Lake & Baba Mandir Excursion",
        description: "A full-day high-altitude excursion (permit required).",
        activities: [
          "Drive to Tsomgo Lake (12,400 ft)",
          "Baba Mandir visit",
          "Optional Nathula Pass (subject to permits)",
          "Return to Gangtok by evening",
        ],
      },
      {
        day: 3,
        title: "Gangtok Local Sightseeing",
        description: "Monasteries, viewpoints and the town's gardens.",
        activities: [
          "Rumtek Monastery",
          "Ganesh Tok & Hanuman Tok",
          "Flower exhibition centre",
          "Tashi viewpoint",
        ],
      },
      {
        day: 4,
        title: "Departure",
        description: "Breakfast, checkout and transfer back.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 3 nights",
      "Private vehicle for transfers & sightseeing",
      "Daily breakfast",
      "Tsomgo Lake permit assistance",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Nathula permit fees",
      "Lunch and dinner unless specified",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Gangtok — confirmed at booking per your budget category"],
    faqs: [
      {
        question: "Do I need a permit for Tsomgo Lake?",
        answer:
          "Yes — Indian nationals need a protected area permit, which we arrange with a copy of your ID and passport photos.",
      },
      {
        question: "Can foreign nationals do this trip?",
        answer:
          "Foreign nationals need additional Sikkim permits; share your details with us and we'll advise before booking.",
      },
    ],
  },
  {
    slug: "darjeeling-gangtok-5n6d",
    title: "Sikkim & Darjeeling Combined Tour",
    destinationSlug: "sikkim-darjeeling",
    duration: "5 Nights / 6 Days",
    description:
      "The classic Himalayan double — Gangtok's lakes and monasteries followed by Darjeeling's tea gardens and toy train, with seamless transfers between the two.",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Himalayan panorama spanning Sikkim and Darjeeling",
    gallery: [
      { src: u("photo-1506905925346-21bda4d32df4", 1200), alt: "Himalayan snow peaks" },
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Darjeeling tea gardens" },
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags in Sikkim" },
    ],
    highlights: ["Tsomgo Lake", "MG Marg", "Tiger Hill", "Toy Train", "Tea Gardens"],
    bestFor: "Families and first-timers wanting both hill classics in one trip",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Gangtok",
        description: "Pickup and scenic drive to Sikkim's capital.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Transfer to Gangtok",
          "Check-in & evening at MG Marg",
        ],
      },
      {
        day: 2,
        title: "Tsomgo Lake & Baba Mandir",
        description: "High-altitude excursion day.",
        activities: [
          "Tsomgo Lake (12,400 ft)",
          "Baba Mandir",
          "Optional Nathula (permits permitting)",
        ],
      },
      {
        day: 3,
        title: "Gangtok Sightseeing & Transfer to Darjeeling",
        description: "Morning local sights, then across to Darjeeling.",
        activities: [
          "Rumtek Monastery & viewpoints",
          "Transfer Gangtok → Darjeeling",
          "Check-in & evening at leisure",
        ],
      },
      {
        day: 4,
        title: "Tiger Hill & Darjeeling Sightseeing",
        description: "Darjeeling's classic sightseeing day.",
        activities: [
          "Tiger Hill sunrise",
          "Batasia Loop & Ghoom Monastery",
          "HMI & Zoo",
          "Tea garden visit",
        ],
      },
      {
        day: 5,
        title: "Toy Train & Town Day",
        description: "Heritage train ride and relaxed exploration.",
        activities: [
          "Toy train joy ride",
          "Peace Pagoda",
          "Shopping & cafés",
        ],
      },
      {
        day: 6,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 5 nights (Gangtok + Darjeeling)",
      "Private vehicle throughout",
      "Daily breakfast",
      "Tsomgo Lake permit assistance",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Nathula permit fees",
      "Lunch and dinner unless specified",
      "Entry fees & toy train tickets",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Gangtok and Darjeeling — confirmed at booking"],
    faqs: [
      {
        question: "How far is Gangtok from Darjeeling?",
        answer:
          "It's roughly a 4-hour drive through rolling tea country and forest — we schedule it mid-trip so it never feels like a travel day.",
      },
    ],
  },
  {
    slug: "darjeeling-kalimpong-retreat-4n5d",
    title: "Darjeeling & Kalimpong Retreat",
    destinationSlug: "darjeeling-kalimpong",
    duration: "4 Nights / 5 Days",
    description:
      "A relaxed hills circuit — Darjeeling's tea gardens and sunrise, then Kalimpong's nurseries, monasteries and quiet viewpoints.",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens of the Darjeeling hills",
    gallery: [
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Tea slopes near Darjeeling" },
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong rooftops in mist" },
      { src: u("photo-1595815771614-ade9d652a65d", 1200), alt: "Pine-lined road above Kalimpong" },
    ],
    highlights: ["Tiger Hill", "Tea Gardens", "Deolo Hill", "Durpin Monastery"],
    bestFor: "Families, senior-friendly trips and slow travellers",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Darjeeling",
        description: "Pickup and drive up to the Queen of the Hills.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Transfer to Darjeeling",
          "Check-in & evening at leisure",
        ],
      },
      {
        day: 2,
        title: "Tiger Hill & Darjeeling Sightseeing",
        description: "The classic Darjeeling day.",
        activities: [
          "Tiger Hill sunrise",
          "Batasia Loop & Ghoom Monastery",
          "HMI & Zoo",
          "Tea garden visit",
        ],
      },
      {
        day: 3,
        title: "Transfer to Kalimpong via Toy Train / Sightseeing",
        description: "A short transfer with sightseeing en route.",
        activities: [
          "Toy train joy ride (subject to availability)",
          "Transfer Darjeeling → Kalimpong",
          "Check-in & evening at leisure",
        ],
      },
      {
        day: 4,
        title: "Kalimpong Sightseeing",
        description: "Nurseries, viewpoints and monasteries.",
        activities: [
          "Deolo Hill & paragliding point",
          "Durpin Monastery",
          "Flower nurseries",
          "Pine View Nursery",
        ],
      },
      {
        day: 5,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 4 nights",
      "Private vehicle throughout",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Lunch and dinner unless specified",
      "Entry fees",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Darjeeling and Kalimpong — confirmed at booking"],
  },
  {
    slug: "sikkim-kalimpong-discovery-5n6d",
    title: "Sikkim & Kalimpong Discovery",
    destinationSlug: "sikkim-kalimpong",
    duration: "5 Nights / 6 Days",
    description:
      "Gangtok's lake excursions and monasteries balanced with Kalimpong's nurseries and hill calm — a well-rounded Eastern Himalaya itinerary.",
    heroImage: u("photo-1626621341517-bbf3d9990a23"),
    heroImageAlt: "Prayer flags over the Sikkim Himalaya",
    gallery: [
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags over Sikkim" },
      { src: u("photo-1573459353208-05d2f14e57d4", 1200), alt: "High-altitude lake" },
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong in mist" },
    ],
    highlights: ["Tsomgo Lake", "Rumtek Monastery", "MG Marg", "Deolo Hill"],
    bestFor: "Travellers wanting both mountain excursions and relaxed hill evenings",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Gangtok",
        description: "Pickup and drive along the Teesta to Gangtok.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Transfer to Gangtok",
          "Evening at MG Marg",
        ],
      },
      {
        day: 2,
        title: "Tsomgo Lake & Baba Mandir",
        description: "High-altitude excursion.",
        activities: ["Tsomgo Lake", "Baba Mandir", "Optional Nathula"],
      },
      {
        day: 3,
        title: "Gangtok Sightseeing",
        description: "Monasteries and viewpoints.",
        activities: [
          "Rumtek Monastery",
          "Ganesh Tok & Hanuman Tok",
          "Tashi viewpoint",
        ],
      },
      {
        day: 4,
        title: "Transfer to Kalimpong",
        description: "Cross the Teesta into Kalimpong.",
        activities: [
          "Transfer Gangtok → Kalimpong",
          "Check-in",
          "Evening market stroll",
        ],
      },
      {
        day: 5,
        title: "Kalimpong Sightseeing",
        description: "Nurseries, viewpoints and monasteries.",
        activities: ["Deolo Hill", "Durpin Monastery", "Flower nurseries"],
      },
      {
        day: 6,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 5 nights",
      "Private vehicle throughout",
      "Daily breakfast",
      "Tsomgo Lake permit assistance",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Nathula permit fees",
      "Lunch and dinner unless specified",
      "Entry fees",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Gangtok and Kalimpong — confirmed at booking"],
  },
  {
    slug: "kalimpong-hills-2n3d",
    title: "Kalimpong Hills Short Break",
    destinationSlug: "kalimpong",
    duration: "2 Nights / 3 Days",
    description:
      "A quick recharge in Kalimpong — viewpoints, nurseries and quiet hill evenings, perfect for a long weekend.",
    heroImage: u("photo-1566837945700-30057527ade0"),
    heroImageAlt: "Kalimpong town in morning mist",
    gallery: [
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong rooftops in mist" },
      { src: u("photo-1595815771614-ade9d652a65d", 1200), alt: "Pine road above Kalimpong" },
    ],
    highlights: ["Deolo Hill", "Durpin Monastery", "Flower Nurseries"],
    bestFor: "Weekend travellers and add-on stays",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Kalimpong Transfer",
        description: "Pickup and a short climb into Kalimpong.",
        activities: [
          "Pickup from NJP / Bagdogra",
          "Transfer to Kalimpong",
          "Check-in & evening at leisure",
        ],
      },
      {
        day: 2,
        title: "Kalimpong Sightseeing",
        description: "The town's best viewpoints and gardens.",
        activities: [
          "Deolo Hill",
          "Durpin Monastery",
          "Flower nurseries",
          "Local markets",
        ],
      },
      {
        day: 3,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 2 nights",
      "Private vehicle for transfers & sightseeing",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Lunch and dinner unless specified",
      "Entry fees",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Kalimpong — confirmed at booking"],
  },
  {
    slug: "dooars-wildlife-2n3d",
    title: "Dooars Wildlife Break",
    destinationSlug: "dooars",
    duration: "2 Nights / 3 Days",
    description:
      "Jeep safaris in Gorumara, rhino country at Jaldapara and evenings beside forest and tea gardens.",
    heroImage: u("photo-1470770903676-69b98201ea1c"),
    heroImageAlt: "Forest river landscape in the Dooars",
    gallery: [
      { src: u("photo-1470770903676-69b98201ea1c", 1200), alt: "Dooars forest and river" },
      { src: u("photo-1544620347-c4fd4a3d5957", 1200), alt: "Safari vehicle on a forest track" },
    ],
    highlights: ["Gorumara Safari", "Jaldapara", "Chapramari", "Tea Gardens"],
    bestFor: "Wildlife lovers and families with children",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Gorumara",
        description: "Pickup and first safari arrangements.",
        activities: [
          "Pickup from NJP / Bagdogra / Siliguri",
          "Transfer to Gorumara area resort",
          "Evening at leisure",
        ],
      },
      {
        day: 2,
        title: "Jeep Safari & Jaldapara",
        description: "A full wildlife day.",
        activities: [
          "Morning jeep safari in Gorumara",
          "Chapramari forest visit",
          "Jaldapara grasslands",
          "Watchtower visit",
        ],
      },
      {
        day: 3,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Resort accommodation for 2 nights",
      "Private vehicle for transfers",
      "Safari booking assistance",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Jeep safari & park entry fees",
      "Lunch and dinner unless specified",
      "Personal expenses",
    ],
    hotels: ["Handpicked resorts near Gorumara — confirmed at booking"],
  },
  {
    slug: "darjeeling-dooars-5n6d",
    title: "Darjeeling & Dooars Combined Tour",
    destinationSlug: "dooars",
    duration: "5 Nights / 6 Days",
    description:
      "Hills and jungle in one trip — Darjeeling's tea gardens and Tiger Hill, then wildlife safaris across the Dooars plains.",
    heroImage: u("photo-1470770903676-69b98201ea1c"),
    heroImageAlt: "Dooars forest landscape",
    gallery: [
      { src: u("photo-1470770903676-69b98201ea1c", 1200), alt: "Dooars forest" },
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Darjeeling tea gardens" },
    ],
    highlights: ["Tiger Hill", "Toy Train", "Gorumara Safari", "Jaldapara"],
    bestFor: "Travellers combining hill scenery with wildlife",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Darjeeling",
        description: "Pickup and drive to the hills.",
        activities: ["Pickup from NJP / Bagdogra", "Transfer to Darjeeling", "Check-in"],
      },
      {
        day: 2,
        title: "Darjeeling Sightseeing",
        description: "Classic Darjeeling day.",
        activities: ["Tiger Hill sunrise", "Batasia Loop", "HMI & Zoo", "Tea gardens"],
      },
      {
        day: 3,
        title: "Toy Train & Transfer to Dooars",
        description: "Heritage train ride, then down to the plains.",
        activities: [
          "Toy train joy ride",
          "Transfer Darjeeling → Dooars",
          "Check-in at resort",
        ],
      },
      {
        day: 4,
        title: "Gorumara Safari",
        description: "A full wildlife day.",
        activities: ["Morning jeep safari", "Chapramari forest", "Watchtower visit"],
      },
      {
        day: 5,
        title: "Jaldapara & Tea Gardens",
        description: "Rhino country and estate drives.",
        activities: ["Jaldapara grasslands", "Tea estate visit", "Evening at leisure"],
      },
      {
        day: 6,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to NJP / Bagdogra"],
      },
    ],
    inclusions: [
      "Hotel & resort accommodation for 5 nights",
      "Private vehicle throughout",
      "Safari booking assistance",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Safari & park entry fees",
      "Lunch and dinner unless specified",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Darjeeling and resorts in the Dooars — confirmed at booking"],
  },
  {
    slug: "meghalaya-explorer-4n5d",
    title: "Meghalaya Explorer",
    destinationSlug: "meghalaya",
    duration: "4 Nights / 5 Days",
    description:
      "Shillong, Cherrapunji's waterfalls, the living root bridges and the crystal Umngot at Dawki — the Abode of Clouds in one loop.",
    heroImage: u("photo-1502786129293-79981df4e689"),
    heroImageAlt: "Waterfalls and green cliffs of Meghalaya",
    gallery: [
      { src: u("photo-1502786129293-79981df4e689", 1200), alt: "Meghalaya waterfall through green cliffs" },
      { src: u("photo-1506059612708-99d6c258160e", 1200), alt: "Mist over Meghalaya's ridges" },
    ],
    highlights: ["Shillong", "Cherrapunji", "Living Root Bridge", "Dawki"],
    bestFor: "Nature lovers and photography-focused trips",
    itinerary: [
      {
        day: 1,
        title: "Arrival & Transfer to Shillong",
        description:
          "Pickup at Guwahati and a drive into the Meghalaya hills.",
        activities: [
          "Pickup from Guwahati airport / station",
          "Transfer to Shillong via Umiam Lake viewpoint",
          "Check-in & evening at leisure",
        ],
      },
      {
        day: 2,
        title: "Shillong to Cherrapunji",
        description: "Waterfalls and caves.",
        activities: [
          "Nohkalikai Falls",
          "Mawsmai Cave",
          "Seven Sisters Falls viewpoint",
          "Arwah Cave (optional)",
        ],
      },
      {
        day: 3,
        title: "Living Root Bridge & Dawki",
        description: "The region's two icons.",
        activities: [
          "Double Decker Living Root Bridge trek",
          "Dawki & the Umngot river",
          "Shnongpdeng riverside stop",
        ],
      },
      {
        day: 4,
        title: "Mawlynnong & Return to Shillong",
        description: "Asia's cleanest village and its sights.",
        activities: [
          "Mawlynnong village walk",
          "Sky View bamboo tower",
          "Return to Shillong",
          "Police Bazar evening",
        ],
      },
      {
        day: 5,
        title: "Departure",
        description: "Breakfast, checkout and transfer.",
        activities: ["Breakfast & checkout", "Transfer to Guwahati"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 4 nights",
      "Private vehicle throughout",
      "Daily breakfast",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Entry fees & activity charges",
      "Lunch and dinner unless specified",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Shillong and Cherrapunji — confirmed at booking"],
  },
  {
    slug: "tawang-valley-5n6d",
    title: "Tawang Valley Expedition",
    destinationSlug: "arunachal-pradesh",
    duration: "5 Nights / 6 Days",
    description:
      "The great Arunachal journey — Sela Pass, Jaswant Garh and Tawang Monastery among the dawn-lit mountains.",
    heroImage: u("photo-1519681393784-d120267933ba"),
    heroImageAlt: "Dawn over snow peaks in Arunachal Pradesh",
    gallery: [
      { src: u("photo-1519681393784-d120267933ba", 1200), alt: "Dawn light on Arunachal peaks" },
      { src: u("photo-1486870591958-9b9d0d1dda99", 1200), alt: "Mountain pass with prayer flags" },
    ],
    highlights: ["Tawang Monastery", "Sela Pass", "Jaswant Garh", "Bum La"],
    bestFor: "Adventure travellers and mountain devotees",
    itinerary: [
      {
        day: 1,
        title: "Arrival at Tezpur / Guwahati",
        description: "Pickup and acclimatisation night.",
        activities: ["Pickup from Tezpur / Guwahati", "Check-in & rest"],
      },
      {
        day: 2,
        title: "Drive to Dirang",
        description: "Into the hills through forest and river valleys.",
        activities: [
          "Drive via Bomdila viewpoint",
          "Dirang hot springs (optional)",
          "Check-in",
        ],
      },
      {
        day: 3,
        title: "Dirang to Tawang via Sela Pass",
        description: "The great high-road day.",
        activities: [
          "Sela Pass & Sela Lake",
          "Jaswant Garh War Memorial",
          "Nuranang Falls",
          "Arrive Tawang",
        ],
      },
      {
        day: 4,
        title: "Tawang Sightseeing",
        description: "Monastery and memorials.",
        activities: [
          "Tawang Monastery",
          "War Memorial",
          "Urgelling Gompa",
          "Local market",
        ],
      },
      {
        day: 5,
        title: "Bum La Excursion & Return toward Dirang",
        description: "Border pass day, then begin the return.",
        activities: [
          "Bum La Pass (permit required)",
          "Madhuri Lake / PTSO",
          "Drive to Dirang",
        ],
      },
      {
        day: 6,
        title: "Departure",
        description: "Breakfast and transfer to Tezpur / Guwahati.",
        activities: ["Breakfast & checkout", "Transfer to Tezpur / Guwahati"],
      },
    ],
    inclusions: [
      "Hotel accommodation for 5 nights",
      "Private vehicle throughout",
      "ILP & permit assistance",
      "Daily breakfast & dinner (standard in Arunachal)",
      "Driver allowance, fuel & tolls",
    ],
    exclusions: [
      "Airfare / train fare",
      "Bum La vehicle & permit fees",
      "Lunch",
      "Personal expenses",
    ],
    hotels: ["Handpicked hotels in Dirang and Tawang — confirmed at booking"],
    faqs: [
      {
        question: "Do I need a permit for Arunachal Pradesh?",
        answer:
          "Yes — Indian nationals need an Inner Line Permit (ILP), which we help arrange; foreign nationals need a PAP and additional clearances. Share your details early so we can plan accordingly.",
      },
    ],
  },
];

export function getPackage(slug: string): TourPackage | undefined {
  return packages.find((p) => p.slug === slug);
}

export function getPackagesByDestination(destinationSlug: string): TourPackage[] {
  return packages.filter((p) => p.destinationSlug === destinationSlug);
}

export function getRelatedPackages(pkg: TourPackage, limit = 3): TourPackage[] {
  return packages
    .filter((p) => p.slug !== pkg.slug)
    .sort((a, b) => {
      const aScore =
        a.destinationSlug === pkg.destinationSlug ? 0 : 1;
      const bScore =
        b.destinationSlug === pkg.destinationSlug ? 0 : 1;
      return aScore - bScore;
    })
    .slice(0, limit);
}

/** Every destination slug that owns at least one package. */
export function packageDestinationSlugs(): string[] {
  return [...new Set(packages.map((p) => p.destinationSlug))];
}
