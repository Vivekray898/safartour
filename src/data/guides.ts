import type { FAQ } from "@/data/faqs";

export type GuideSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  destination: string;
  heroImage: string;
  heroImageAlt: string;
  publishedAt?: string;
  content: GuideSection[];
  faqs?: FAQ[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const guides: Guide[] = [
  {
    slug: "darjeeling-travel-guide",
    title: "Darjeeling Travel Guide",
    excerpt:
      "Tiger Hill sunrises, toy train rides, tea garden walks and the best times to visit the Queen of the Hills.",
    destination: "darjeeling",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens and hills around Darjeeling",
    publishedAt: "2026-01-12",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "Darjeeling sits at about 2,000 metres in the Mahabharat Range, wrapped in tea gardens and crowned by views of Mount Kanchenjunga. It is a town best enjoyed slowly — mornings for sunrises and monasteries, afternoons for markets and cafés, evenings for Mall Road.",
          "This guide covers what to see, when to come, how to reach and the practical tips that make a Darjeeling trip smooth.",
        ],
      },
      {
        id: "places-to-visit",
        heading: "Places to Visit",
        paragraphs: [
          "Most Darjeeling itineraries revolve around a handful of unmissable sights, all reachable within short drives of the town centre.",
        ],
        list: [
          "Tiger Hill — the famous Kanchenjunga sunrise",
          "Batasia Loop — the toy train's spiral and war memorial",
          "Darjeeling Himalayan Railway — the UNESCO-listed toy train",
          "Himalayan Mountaineering Institute & Zoo",
          "Tea estates such as Happy Valley for estate walks and tastings",
          "Peace Pagoda and the Japanese Temple",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "March to May brings clear mornings, blooming rhododendrons and comfortable temperatures. October to December offers the year's crispest mountain views after the monsoon washes the sky clean. January can be cold but magical with occasional snow, while the monsoon (June–September) is lush but wet.",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "Bagdogra Airport (IXB) and New Jalpaiguri station (NJP) are the gateways. From either, Darjeeling is a scenic 3-hour hill drive. We provide private transfers from both — your driver meets you at the arrival gate or platform.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["A few local notes that make the trip easier:"],
        list: [
          "Book toy train joy rides well in advance for season dates",
          "Carry cash — card networks can be patchy in the bazaar",
          "Pack layers; evenings are cool even in summer",
          "Start Tiger Hill drives early — shared departure is around 3:30 AM",
        ],
      },
    ],
    faqs: [
      {
        question: "How many days are enough for Darjeeling?",
        answer:
          "Three to four days comfortably cover Tiger Hill, the toy train, tea gardens and the town at a relaxed pace.",
      },
      {
        question: "Is Darjeeling good for a family trip?",
        answer:
          "Yes — it's one of India's most family-friendly hill stations, with gentle sightseeing and short drives.",
      },
    ],
  },
  {
    slug: "sikkim-travel-guide",
    title: "Sikkim Travel Guide",
    excerpt:
      "Tsomgo Lake, high passes, monasteries and the Valley of Flowers — planning Sikkim the right way.",
    destination: "sikkim",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Snow peaks of Sikkim",
    publishedAt: "2026-01-20",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "Sikkim rewards travellers with the Himalaya at its most dramatic — glacial lakes, 14,000-ft passes and monastery towns beneath snow peaks. Tourism is organised around protected-area permits, which makes planning ahead genuinely important.",
        ],
      },
      {
        id: "places-to-visit",
        heading: "Places to Visit",
        paragraphs: [
          "Gangtok is the base for most circuits, with excursions fanning out to the east, north and west.",
        ],
        list: [
          "Tsomgo Lake & Baba Mandir — the classic east-Sikkim excursion",
          "Nathula Pass — the Silk Route pass (permits and weather permitting)",
          "Rumtek Monastery — Sikkim's most significant gompa",
          "Yumthang Valley — North Sikkim's Valley of Flowers",
          "MG Marg — Gangtok's car-free promenade",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "March to June and October to December are ideal. North Sikkim is generally best from late March to May and again in October; high routes can close in winter and monsoon.",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "Fly to Bagdogra (IXB) or take a train to New Jalpaiguri (NJP), then drive 4–4.5 hours to Gangtok. Shared and private options exist — private vehicles with permit assistance make east and north Sikkim far easier.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["Permits and altitude are the two things to plan for:"],
        list: [
          "Carry original photo ID plus 2 passport photos for permits",
          "Ascend gradually — spend a night in Gangtok before high excursions",
          "Foreign nationals need PAP/RAP; tell us your nationality when enquiring",
          "Nathula is closed on some weekdays and in bad weather — keep plans flexible",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Nathula Pass open for tourists?",
        answer:
          "For Indian nationals on most days except Mondays and Tuesdays, subject to permits and weather. We arrange permits with your ID documents in advance.",
      },
      {
        question: "Can I visit North Sikkim with children?",
        answer:
          "Older children usually handle it well, but very young children and infants are not advised on high-altitude overnight routes like Lachen/Lachung.",
      },
    ],
  },
  {
    slug: "kalimpong-travel-guide",
    title: "Kalimpong Travel Guide",
    excerpt:
      "Nurseries, monasteries and viewpoints — the quiet hill town that pairs perfectly with Darjeeling.",
    destination: "kalimpong",
    heroImage: u("photo-1566837945700-30057527ade0"),
    heroImageAlt: "Kalimpong rooftops in the morning mist",
    publishedAt: "2026-02-02",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "Kalimpong moves at a gentler pace than its famous neighbour. Famous for flower nurseries, colonial-era schools and sweeping ridge-top views, it's the ideal second stop on a Darjeeling circuit — or a restful destination in its own right.",
        ],
      },
      {
        id: "places-to-visit",
        heading: "Places to Visit",
        paragraphs: ["Compact enough to cover in a day, rewarding over two."],
        list: [
          "Deolo Hill — the town's high point with paragliding",
          "Durpin Monastery and its hilltop views",
          "Pine View Nursery — orchids galore",
          "Dr. Graham's Homes campus",
          "Teesta riverside drives",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "Pleasant year-round; the clearest views come from October to December and again in spring, March to May.",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "About 2.5 hours from NJP or Bagdogra, and roughly 2 hours from Darjeeling via the Teesta valley road — an easy link on any Eastern Himalaya itinerary.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["Small things that improve a Kalimpong stay:"],
        list: [
          "Combine with Darjeeling — the transfer is short and scenic",
          "Try lollipops from the famous local shops as gifts",
          "Mornings are clearest for viewpoints; plan Deolo early",
          "Paragliding runs on clear days — book the day before",
        ],
      },
    ],
  },
  {
    slug: "sikkim-darjeeling-travel-guide",
    title: "Sikkim & Darjeeling Travel Guide",
    excerpt:
      "How to combine Gangtok and Darjeeling in one itinerary — routes, nights and the classic sightseeing order.",
    destination: "sikkim-darjeeling",
    heroImage: u("photo-1593693397690-362cb9666fc2"),
    heroImageAlt: "Toy train through the hills between Sikkim and Darjeeling",
    publishedAt: "2026-02-14",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "Sikkim and Darjeeling complement each other perfectly — one offers high-altitude drama, the other colonial charm and tea. Because they're connected by a short scenic drive, most travellers do both in a single 5–7 day trip.",
        ],
      },
      {
        id: "itinerary-order",
        heading: "The Ideal Itinerary Order",
        paragraphs: [
          "Arrive NJP/Bagdogra → Gangtok (2–3 nights with Tsomgo excursion) → Darjeeling (2 nights with Tiger Hill and toy train) → depart. Doing Gangtok first lets you acclimatise gradually, and saves Darjeeling's sunrise for the finale.",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "The twin sweet spots are March–June and October–December. Avoid planning east-Sikkim excursions on Mondays/Tuesdays if Nathula matters to you (it stays closed those days).",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "Both destinations share the same gateways — Bagdogra airport and NJP station. A single private vehicle can cover the entire circuit including the Gangtok–Darjeeling transfer.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["Planning notes for the combined circuit:"],
        list: [
          "Carry ID proofs for Sikkim permits from day one",
          "Keep one buffer evening for weather delays in high sections",
          "Toy train tickets sell out weeks ahead in season",
          "Book hotels near MG Marg and Mall Road for car-free evenings",
        ],
      },
    ],
  },
  {
    slug: "darjeeling-kalimpong-travel-guide",
    title: "Darjeeling & Kalimpong Travel Guide",
    excerpt:
      "Two hill towns, one relaxed circuit — how to pace Darjeeling and Kalimpong together.",
    destination: "darjeeling-kalimpong",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens between Darjeeling and Kalimpong",
    publishedAt: "2026-02-25",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "If Sikkim's permits and high altitudes feel like too much, the Darjeeling–Kalimpong pair is the gentler Eastern Himalaya circuit — all of the views and tea-garden charm, none of the paperwork.",
        ],
      },
      {
        id: "places-to-visit",
        heading: "Places to Visit",
        paragraphs: [
          "The circuit divides neatly: Darjeeling for sunrises and the railway, Kalimpong for nurseries and ridge walks.",
        ],
        list: [
          "Tiger Hill & Batasia Loop",
          "Darjeeling tea estates",
          "Deolo Hill & Durpin Monastery in Kalimpong",
          "Teesta valley drives between the two towns",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "October–December for clarity, March–May for blooms and mild warmth. Both towns stay accessible year-round.",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "Fly into Bagdogra or arrive at NJP; Darjeeling is about 3 hours away and Kalimpong another 2 hours beyond via the Teesta. Many travellers finish in Kalimpong for the shorter descent to the plains.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["Making the most of both towns:"],
        list: [
          "Two nights Darjeeling + one night Kalimpong is the comfortable minimum",
          "End in Kalimpong if your departure is early — it's closer to NJP/Bagdogra",
          "Book paragliding a day ahead in season",
          "Keep evenings free — both towns are best on foot",
        ],
      },
    ],
  },
  {
    slug: "sikkim-kalimpong-travel-guide",
    title: "Sikkim & Kalimpong Travel Guide",
    excerpt:
      "Pairing Sikkim's lake excursions with Kalimpong's calm — permits, pacing and the route.",
    destination: "sikkim-kalimpong",
    heroImage: u("photo-1626621341517-bbf3d9990a23"),
    heroImageAlt: "Prayer flags above the road into Sikkim",
    publishedAt: "2026-03-05",
    content: [
      {
        id: "introduction",
        heading: "Introduction",
        paragraphs: [
          "This pairing trades Darjeeling's bustle for Kalimpong's quiet. You keep Sikkim's headline excursions — Tsomgo Lake, Rumtek, MG Marg — and swap the last nights for nursery gardens and ridge-top sunsets.",
        ],
      },
      {
        id: "places-to-visit",
        heading: "Places to Visit",
        paragraphs: [
          "Gangtok anchors the first half; Kalimpong rewards the second.",
        ],
        list: [
          "Tsomgo Lake & Baba Mandir",
          "Rumtek Monastery",
          "MG Marg evenings",
          "Deolo Hill and the flower nurseries of Kalimpong",
        ],
      },
      {
        id: "best-time",
        heading: "Best Time to Visit",
        paragraphs: [
          "March–June and October–December, matching the Sikkim season. Kalimpong itself is pleasant year-round.",
        ],
      },
      {
        id: "how-to-reach",
        heading: "How to Reach",
        paragraphs: [
          "Bagdogra/NJP to Gangtok is about 4–4.5 hours; Gangtok to Kalimpong a further 2.5–3 hours via Rangpo. Return transfers from Kalimpong to the airport are shorter — around 2.5 hours.",
        ],
      },
      {
        id: "travel-tips",
        heading: "Travel Tips",
        paragraphs: ["Practical notes for this circuit:"],
        list: [
          "Sikkim permits still apply — carry ID copies and photos",
          "Kalimpong makes a relaxed final night before departure",
          "The Teesta valley road is scenic — allow photo stops",
          "Combine market mornings in Gangtok with nursery afternoons in Kalimpong",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
