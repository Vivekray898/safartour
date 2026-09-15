export type Destination = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  gallery: { src: string; alt: string }[];
  attractions: { name: string; description: string }[];
  bestTime?: string;
  relatedPackages: string[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const destinations: Destination[] = [
  {
    slug: "darjeeling",
    name: "Darjeeling",
    shortDescription: "The Queen of the Hills — tea gardens, toy train and Kanchenjunga views.",
    description:
      "Darjeeling is a captivating hill station in West Bengal, famous worldwide for its exquisite tea plantations. A major highlight is the UNESCO World Heritage Darjeeling Himalayan Railway — the charming toy train that winds through the hills past the Batasia Loop. Visitors can experience a breathtaking sunrise over Mount Kanchenjunga from Tiger Hill and explore serene monasteries, vibrant local markets and the Himalayan Mountaineering Institute.",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Rolling tea garden slopes in the Darjeeling hills",
    gallery: [
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Tea gardens on the slopes around Darjeeling" },
      { src: u("photo-1593693397690-362cb9666fc2", 1200), alt: "Darjeeling Himalayan Railway toy train in the hills" },
      { src: u("photo-1512100356356-de1b84283e18", 1200), alt: "Colourful hillside houses of Darjeeling town" },
    ],
    attractions: [
      { name: "Tiger Hill", description: "Sunrise over Mount Kanchenjunga and the eastern Himalaya." },
      { name: "Batasia Loop", description: "The toy train's spiral engineering marvel with war memorial views." },
      { name: "Tea Gardens", description: "Walk the estate rows that produce world-famous Darjeeling tea." },
      { name: "Darjeeling Himalayan Railway", description: "The UNESCO-listed toy train through the hills." },
      { name: "Himalayan Mountaineering Institute", description: "Mountaineering museum and zoo set on Birch Hill." },
    ],
    bestTime: "March to May and October to December offer the clearest skies and views.",
    relatedPackages: ["darjeeling-escape-3n4d", "darjeeling-gangtok-5n6d", "darjeeling-kalimpong-retreat-4n5d"],
  },
  {
    slug: "sikkim",
    name: "Sikkim",
    shortDescription: "High-altitude lakes, monasteries and Himalayan panoramas.",
    description:
      "A hidden gem of the Himalayas, Sikkim is a haven for those seeking peace and adventure. The state is known for its majestic mountain scenery, high-altitude lakes and peaceful Buddhist monasteries. Gangtok blends modern city life with traditional culture, while Tsomgo Lake, Rumtek Monastery and the Yumthang Valley showcase the state's raw natural beauty.",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Snow-capped Himalayan peaks in Sikkim",
    gallery: [
      { src: u("photo-1506905925346-21bda4d32df4", 1200), alt: "Snow peaks towering over Sikkim's high country" },
      { src: u("photo-1573459353208-05d2f14e57d4", 1200), alt: "High-altitude lake reflecting the mountains" },
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags against a Himalayan sky" },
    ],
    attractions: [
      { name: "Tsomgo Lake", description: "A sacred glacial lake at 12,400 ft, an hour from Gangtok." },
      { name: "Rumtek Monastery", description: "One of the largest and most significant monasteries in Sikkim." },
      { name: "Yumthang Valley", description: "The Valley of Flowers, ringed by snow peaks in North Sikkim." },
      { name: "MG Marg, Gangtok", description: "The pedestrian heart of Gangtok — cafés, shops and mountain air." },
      { name: "Nathula Pass", description: "A historic Himalayan pass on the ancient Silk Route (permit required)." },
    ],
    bestTime: "March to June and October to December; North Sikkim is best from late March to May.",
    relatedPackages: ["sikkim-gangtok-getaway-3n4d", "darjeeling-gangtok-5n6d", "sikkim-kalimpong-discovery-5n6d"],
  },
  {
    slug: "kalimpong",
    name: "Kalimpong",
    shortDescription: "A laid-back hill town of flower nurseries and colonial charm.",
    description:
      "A tranquil hill station with a rich history and laid-back charm, Kalimpong is famous for its beautiful flower nurseries. Colonial-era architecture tells the story of its past, and its peaceful atmosphere makes it a perfect retreat away from the crowds. Adventure seekers can try paragliding and river rafting on the Teesta.",
    heroImage: u("photo-1566837945700-30057527ade0"),
    heroImageAlt: "Misty rooftops of Kalimpong at dawn",
    gallery: [
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong town rooftops in morning mist" },
      { src: u("photo-1595815771614-ade9d652a65d", 1200), alt: "Pine-lined road above Kalimpong" },
      { src: u("photo-1587061949409-02df41d5e562", 1200), alt: "Forest gorge near Kalimpong" },
    ],
    attractions: [
      { name: "Deolo Hill", description: "Kalimpong's highest point with paragliding and 360° views." },
      { name: "Flower Nurseries", description: "Orchids and gladioli that made Kalimpong famous." },
      { name: "Durpin Monastery", description: "Hilltop monastery with sweeping valley views." },
      { name: "Teesta River Rafting", description: "Grade II–III rapids between forested banks." },
      { name: "Dr. Graham's Homes", description: "Historic colonial-era campus spread across a hillside." },
    ],
    bestTime: "Year-round; March to May and October to December are most pleasant.",
    relatedPackages: ["kalimpong-hills-2n3d", "darjeeling-kalimpong-retreat-4n5d", "sikkim-kalimpong-discovery-5n6d"],
  },
  {
    slug: "dooars",
    name: "Dooars",
    shortDescription: "Wildlife, forests and tea gardens at the foothills of the Himalaya.",
    description:
      "Located at the foothills of the Eastern Himalayas, the Dooars is a paradise for nature and wildlife lovers. The region is characterised by lush tea gardens, dense forests and vibrant wildlife — home to Gorumara and Jaldapara National Parks, where you can spot the Indian rhinoceros, elephants and rich birdlife on jeep safaris.",
    heroImage: u("photo-1470770903676-69b98201ea1c"),
    heroImageAlt: "Forest and river landscape in the Dooars foothills",
    gallery: [
      { src: u("photo-1470770903676-69b98201ea1c", 1200), alt: "River flowing through Dooars forest country" },
      { src: u("photo-1608083950849-53a6a6dc0b02", 1200), alt: "Golden light over the Dooars plains" },
      { src: u("photo-1544620347-c4fd4a3d5957", 1200), alt: "Safari vehicle at a forest trail" },
    ],
    attractions: [
      { name: "Gorumara National Park", description: "Jeep safaris for rhinos, elephants and bison." },
      { name: "Jaldapara National Park", description: "One of the last strongholds of the one-horned rhinoceros." },
      { name: "Chapramari Forest", description: "Dense forest famous for elephants and birdlife." },
      { name: "Tea Gardens", description: "Endless manicured estates across the Dooars plains." },
    ],
    bestTime: "November to April, when the parks are open and the weather is cool.",
    relatedPackages: ["dooars-wildlife-2n3d", "darjeeling-dooars-5n6d"],
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    shortDescription: "The Abode of Clouds — waterfalls, caves and living root bridges.",
    description:
      "Known as the Abode of the Clouds, Meghalaya is a state of breathtaking waterfalls, mysterious caves and living root bridges. Shillong, the capital, is often called the Scotland of the East. Cherrapunji, one of the wettest places on earth, is home to Nohkalikai Falls and the remarkable Double Decker Living Root Bridge.",
    heroImage: u("photo-1502786129293-79981df4e689"),
    heroImageAlt: "Lush green hills and waterfalls of Meghalaya",
    gallery: [
      { src: u("photo-1502786129293-79981df4e689", 1200), alt: "Waterfall plunging through Meghalaya's green cliffs" },
      { src: u("photo-1580655653885-65763b2597d0", 1200), alt: "River valley in the Meghalaya hills" },
      { src: u("photo-1506059612708-99d6c258160e", 1200), alt: "Mist rolling over forested ridges" },
    ],
    attractions: [
      { name: "Double Decker Living Root Bridge", description: "A bio-engineering marvel grown from rubber fig roots." },
      { name: "Nohkalikai Falls", description: "India's tallest plunge waterfall, near Cherrapunji." },
      { name: "Mawsmai Cave", description: "An illuminated limestone cave open to visitors." },
      { name: "Shillong", description: "The Scotland of the East — lakes, cafés and pine hills." },
      { name: "Dawki", description: "The impossibly clear Umngot river on the Bangladesh border." },
    ],
    bestTime: "October to April; the waterfalls are fullest just after the monsoon.",
    relatedPackages: ["meghalaya-explorer-4n5d"],
  },
  {
    slug: "arunachal-pradesh",
    name: "Arunachal Pradesh",
    shortDescription: "The Land of the Dawn-Lit Mountains — Tawang, Sela Pass and tribal culture.",
    description:
      "The Land of the Dawn-Lit Mountains is a state of snow-capped peaks and serene valleys. Tawang, home to its massive second-largest-in-the-world monastery, is the highlight, and the journey there crosses the high Sela Pass and the Jaswant Garh War Memorial. Rich tribal culture and pristine landscapes make it a truly off-the-beaten-path destination.",
    heroImage: u("photo-1519681393784-d120267933ba"),
    heroImageAlt: "Dawn light on snow-covered Arunachal Himalaya",
    gallery: [
      { src: u("photo-1519681393784-d120267933ba", 1200), alt: "Snow peaks glowing at dawn in Arunachal Pradesh" },
      { src: u("photo-1486870591958-9b9d0d1dda99", 1200), alt: "High mountain pass road with prayer flags" },
      { src: u("photo-1476514525535-07fb3b4ae5f1", 1200), alt: "Alpine lake below snowbound peaks" },
    ],
    attractions: [
      { name: "Tawang Monastery", description: "The second-largest Buddhist monastery in the world." },
      { name: "Sela Pass", description: "A dramatic 13,700 ft pass with the sacred Sela Lake." },
      { name: "Jaswant Garh", description: "A moving war memorial on the Tawang road." },
      { name: "Bum La Pass", description: "The India–China border pass above Tawang (permit required)." },
    ],
    bestTime: "March to June and September to November; winters bring heavy snow.",
    relatedPackages: ["tawang-valley-5n6d"],
  },
  {
    slug: "sikkim-darjeeling",
    name: "Sikkim + Darjeeling",
    shortDescription: "The classic Himalayan double: Gangtok's lakes and Darjeeling's tea gardens.",
    description:
      "Combine the highlights of two Himalayan classics in one seamless journey — Gangtok's Tsomgo Lake and monasteries, then the toy train, tea gardens and Tiger Hill sunrise of Darjeeling. Transfers between the two are short, making this the most popular combined circuit we run.",
    heroImage: u("photo-1506905925346-21bda4d32df4"),
    heroImageAlt: "Himalayan peaks spanning Sikkim and Darjeeling",
    gallery: [
      { src: u("photo-1506905925346-21bda4d32df4", 1200), alt: "Himalayan snow peaks" },
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Darjeeling tea gardens" },
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags in Sikkim" },
    ],
    attractions: [
      { name: "Tsomgo Lake", description: "Glacial lake excursion from Gangtok." },
      { name: "MG Marg", description: "Gangtok's lively pedestrian mall." },
      { name: "Tiger Hill", description: "Darjeeling's famous Kanchenjunga sunrise." },
      { name: "Toy Train", description: "The UNESCO Heritage railway ride." },
    ],
    bestTime: "March to June and October to December.",
    relatedPackages: ["darjeeling-gangtok-5n6d", "sikkim-gangtok-getaway-3n4d", "darjeeling-escape-3n4d"],
  },
  {
    slug: "darjeeling-kalimpong",
    name: "Darjeeling + Kalimpong",
    shortDescription: "Two hill towns, one relaxed trip — tea gardens plus nurseries and viewpoints.",
    description:
      "A gentler Himalayan circuit pairing Darjeeling's tea estates and toy train with Kalimpong's flower nurseries, monasteries and laid-back hill atmosphere — ideal for families and slow travellers who want the hills without rushing.",
    heroImage: u("photo-1602088113235-229c19758e9f"),
    heroImageAlt: "Tea gardens of the Darjeeling hills",
    gallery: [
      { src: u("photo-1602088113235-229c19758e9f", 1200), alt: "Darjeeling tea slopes" },
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong rooftops in mist" },
      { src: u("photo-1595815771614-ade9d652a65d", 1200), alt: "Pine road near Kalimpong" },
    ],
    attractions: [
      { name: "Tiger Hill", description: "Sunrise over Kanchenjunga." },
      { name: "Tea Gardens", description: "Estate walks among the tea bushes." },
      { name: "Deolo Hill", description: "Kalimpong's highest viewpoint." },
      { name: "Durpin Monastery", description: "Hilltop gompa with valley views." },
    ],
    bestTime: "March to May and October to December.",
    relatedPackages: ["darjeeling-kalimpong-retreat-4n5d", "darjeeling-escape-3n4d", "kalimpong-hills-2n3d"],
  },
  {
    slug: "sikkim-kalimpong",
    name: "Sikkim + Kalimpong",
    shortDescription: "Gangtok's lakes and monasteries with Kalimpong's quiet hill charm.",
    description:
      "Pair Sikkim's high-altitude drama — Tsomgo Lake, Rumtek, MG Marg — with Kalimpong's nurseries and viewpoints across the Teesta. A balanced itinerary that mixes mountain excursions with relaxed hill-town evenings.",
    heroImage: u("photo-1626621341517-bbf3d9990a23"),
    heroImageAlt: "Prayer flags over the Sikkim Himalaya",
    gallery: [
      { src: u("photo-1626621341517-bbf3d9990a23", 1200), alt: "Prayer flags over Sikkim" },
      { src: u("photo-1573459353208-05d2f14e57d4", 1200), alt: "High-altitude lake in Sikkim" },
      { src: u("photo-1566837945700-30057527ade0", 1200), alt: "Kalimpong in the mist" },
    ],
    attractions: [
      { name: "Tsomgo Lake", description: "Sacred glacial lake excursion." },
      { name: "Rumtek Monastery", description: "Sikkim's most significant gompa." },
      { name: "Deolo Hill", description: "Kalimpong's paragliding viewpoint." },
      { name: "MG Marg", description: "Gangtok's car-free centre." },
    ],
    bestTime: "March to June and October to December.",
    relatedPackages: ["sikkim-kalimpong-discovery-5n6d", "sikkim-gangtok-getaway-3n4d", "kalimpong-hills-2n3d"],
  },
];

export function getDestination(slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug);
}
