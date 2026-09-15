import type { FAQ } from "@/data/faqs";

export type RouteInfo = {
  slug: string;
  from: string;
  to: string;
  title: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  /** Include only confirmed figures; omit when unavailable. */
  distance?: string;
  duration?: string;
  routeType: "Airport Transfer" | "Railway Transfer" | "Inter-city";
  pickupPoints: string[];
  dropPoints: string[];
  popularStops: string[];
  recommendedVehicles: string[];
  faqs?: FAQ[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const routes: RouteInfo[] = [
  {
    slug: "bagdogra-airport-to-darjeeling",
    from: "Bagdogra Airport (IXB)",
    to: "Darjeeling",
    title: "Bagdogra Airport to Darjeeling Taxi",
    description:
      "Start your hills holiday the moment you land — a private pickup at Bagdogra and a scenic climb to Darjeeling.",
    heroImage: u("photo-1533473359331-0135ef1b58bf"),
    heroImageAlt: "Car climbing a winding hill road toward Darjeeling",
    routeType: "Airport Transfer",
    pickupPoints: ["Bagdogra Airport arrival gate"],
    dropPoints: ["Darjeeling town hotels", "Ghoom", "Jorethang road hotels"],
    popularStops: ["Kurseong", "Tung viewpoint", "Tea gardens en route"],
    recommendedVehicles: ["sedan", "suv", "luxury-suv"],
    faqs: [
      {
        question: "Will the driver wait if my flight is delayed?",
        answer:
          "Yes — share your flight number when booking and the driver tracks your arrival time.",
      },
    ],
  },
  {
    slug: "njp-to-darjeeling",
    from: "New Jalpaiguri (NJP)",
    to: "Darjeeling",
    title: "NJP to Darjeeling Taxi",
    description:
      "The classic station-to-hills transfer — meet your driver at NJP and reach Darjeeling relaxed.",
    heroImage: u("photo-1593693397690-362cb9666fc2"),
    heroImageAlt: "Toy train tracks through the hills toward Darjeeling",
    routeType: "Railway Transfer",
    pickupPoints: ["NJP station main exit"],
    dropPoints: ["Darjeeling town hotels"],
    popularStops: ["Kurseong", "Ghoom"],
    recommendedVehicles: ["sedan", "suv", "economy-suv"],
  },
  {
    slug: "bagdogra-airport-to-gangtok",
    from: "Bagdogra Airport (IXB)",
    to: "Gangtok",
    title: "Bagdogra Airport to Gangtok Taxi",
    description:
      "A smooth private transfer from the airport to Sikkim's capital along the Teesta river.",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Himalayan peaks above the road to Gangtok",
    routeType: "Airport Transfer",
    pickupPoints: ["Bagdogra Airport arrival gate"],
    dropPoints: ["Gangtok hotels", "MG Marg area"],
    popularStops: ["Teesta riverside", "Rangpo checkpost"],
    recommendedVehicles: ["sedan", "suv", "luxury-suv"],
  },
  {
    slug: "njp-to-gangtok",
    from: "New Jalpaiguri (NJP)",
    to: "Gangtok",
    title: "NJP to Gangtok Taxi",
    description:
      "The most booked transfer in the region — direct from the platform to your Gangtok hotel.",
    heroImage: u("photo-1626621341517-bbf3d9990a23"),
    heroImageAlt: "Prayer flags over the Teesta valley road",
    routeType: "Railway Transfer",
    pickupPoints: ["NJP station main exit"],
    dropPoints: ["Gangtok hotels", "MG Marg area"],
    popularStops: ["Teesta riverside", "Rangpo checkpost"],
    recommendedVehicles: ["sedan", "suv", "economy-suv", "tempo-traveller"],
  },
  {
    slug: "darjeeling-to-gangtok",
    from: "Darjeeling",
    to: "Gangtok",
    title: "Darjeeling to Gangtok Taxi",
    description:
      "Connect the two hill capitals comfortably mid-trip, with photo stops along the way.",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens along the Darjeeling–Gangtok route",
    routeType: "Inter-city",
    pickupPoints: ["Darjeeling hotels"],
    dropPoints: ["Gangtok hotels"],
    popularStops: ["Teesta Bazaar", "Lava road viewpoint"],
    recommendedVehicles: ["suv", "luxury-suv", "tempo-traveller"],
  },
  {
    slug: "gangtok-to-pelling",
    from: "Gangtok",
    to: "Pelling",
    title: "Gangtok to Pelling Taxi",
    description:
      "Head west to Pelling's up-close Kanchenjunga views via some of Sikkim's prettiest valley roads.",
    heroImage: u("photo-1573459353208-05d2f14e57d4"),
    heroImageAlt: "High valley road toward Pelling",
    routeType: "Inter-city",
    pickupPoints: ["Gangtok hotels"],
    dropPoints: ["Pelling hotels"],
    popularStops: ["Ravangla", "Teesta dam viewpoint"],
    recommendedVehicles: ["suv", "luxury-suv"],
  },
];

export function getRoute(slug: string): RouteInfo | undefined {
  return routes.find((r) => r.slug === slug);
}
