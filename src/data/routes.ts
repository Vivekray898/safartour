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
  /** Optional one-line note on how the journey feels (road type, views). */
  journeyNote?: string;
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
    distance: "~68 km",
    duration: "~3 hrs",
    journeyNote:
      "Plains out of the airport, then a steady climb through tea gardens and forest from Kurseong onwards.",
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
    distance: "~73 km",
    duration: "~3–3.5 hrs",
    journeyNote:
      "Hill road nearly the whole way — watch the countryside change as you climb past Kurseong and Ghoom.",
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
    distance: "~125 km",
    duration: "~4–4.5 hrs",
    journeyNote:
      "The longest of the airport runs — mostly along the Teesta river with a checkpost stop at Rangpo.",
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
    distance: "~120 km",
    duration: "~4–4.5 hrs",
    journeyNote:
      "A comfortable highway run along the Teesta to Rangpo, then the climb into Gangtok.",
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
    distance: "~100 km",
    duration: "~4 hrs",
    journeyNote:
      "Descend to the Teesta valley and climb again — a half-day drive best started in the morning.",
    pickupPoints: ["Darjeeling hotels"],
    dropPoints: ["Gangtok hotels"],
    popularStops: ["Teesta Bazaar", "Lava road viewpoint"],
    recommendedVehicles: ["suv", "luxury-suv", "tempo-traveller"],
  },
  {
    slug: "njp-to-kalimpong",
    from: "New Jalpaiguri (NJP)",
    to: "Kalimpong",
    title: "NJP to Kalimpong Taxi",
    description:
      "The quickest hill station to reach from NJP — a short, beautiful climb to Kalimpong's nurseries and viewpoints.",
    heroImage: u("photo-1593693397690-362cb9666fc2"),
    heroImageAlt: "Hill road winding toward Kalimpong",
    routeType: "Railway Transfer",
    distance: "~66 km",
    duration: "~2.5–3 hrs",
    journeyNote:
      "An easy first-day drive — mostly highway, then a short climb past Kalimpong's nurseries and viewpoint roads.",
    pickupPoints: ["NJP station main exit", "Bagdogra Airport on request"],
    dropPoints: ["Kalimpong town hotels", "Durpin & Deolo hill areas"],
    popularStops: ["Teesta Bazaar", "Kalimpong town"],
    recommendedVehicles: ["sedan", "suv", "economy-suv"],
  },
  {
    slug: "siliguri-to-dooars",
    from: "Siliguri",
    to: "Dooars (Lataguri / Jaldapara)",
    title: "Siliguri to Dooars Taxi",
    description:
      "Swap the hills for forests and wildlife — a smooth drive into the Dooars' tea gardens and national parks.",
    heroImage: u("photo-1500534623283-312ddeade756"),
    heroImageAlt: "Forest road in the Dooars with distant hills",
    routeType: "Inter-city",
    distance: "~90–110 km",
    duration: "~2.5–3.5 hrs",
    journeyNote:
      "The easiest drive of the lot — flat roads through tea gardens and forest, ideal for families with children.",
    pickupPoints: ["Siliguri city / NJP / Bagdogra"],
    dropPoints: ["Lataguri (Gorumara)", "Jaldapara (Madarihat)", "Dooars resorts"],
    popularStops: ["Gorumara National Park", "Jaldapara National Park", "Chapramari"],
    recommendedVehicles: ["suv", "economy-suv", "tempo-traveller"],
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
    distance: "~130 km",
    duration: "~5 hrs",
    journeyNote:
      "A full-day scenic drive across Sikkim via Ravangla — mountain views open up near the end.",
    pickupPoints: ["Gangtok hotels"],
    dropPoints: ["Pelling hotels"],
    popularStops: ["Ravangla", "Teesta dam viewpoint"],
    recommendedVehicles: ["suv", "luxury-suv"],
  },
];

export function getRoute(slug: string): RouteInfo | undefined {
  return routes.find((r) => r.slug === slug);
}

const ROUTE_DESTINATIONS: Record<string, string> = {
  darjeeling: "njp-to-darjeeling",
  sikkim: "njp-to-gangtok",
  kalimpong: "njp-to-kalimpong",
  dooars: "siliguri-to-dooars",
  meghalaya: "njp-to-gangtok",
  "arunachal-pradesh": "njp-to-gangtok",
};

/** The most relevant transfer route for a destination (e.g. Sikkim → NJP to Gangtok). */
export function getRouteForDestination(destinationSlug: string): RouteInfo | undefined {
  return getRoute(ROUTE_DESTINATIONS[destinationSlug] ?? "");
}

/** Destination package-page slug a route terminates in, when one exists (e.g. Gangtok → sikkim). */
export function getDestinationForRoute(routeSlug: string): string | undefined {
  const entry = Object.entries(ROUTE_DESTINATIONS).find(
    ([, route]) => route === routeSlug
  );
  return entry?.[0];
}

/** Related transfers: same "to" or same "from", current route excluded. */
export function getRelatedRoutes(routeSlug: string, limit = 3): RouteInfo[] {
  const current = getRoute(routeSlug);
  if (!current) return [];
  return routes
    .filter((r) => r.slug !== routeSlug)
    .map((r) => ({
      r,
      score:
        (r.to === current.to ? 2 : 0) +
        (r.from === current.from ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}
