export type GalleryImage = {
  src: string;
  alt: string;
  category: "Darjeeling" | "Sikkim" | "Kalimpong" | "Travel" | "Vehicles";
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const galleryImages: GalleryImage[] = [
  { src: u("photo-1506905925346-21bda4d32df4"), alt: "Snow-capped Himalayan peaks under a clear blue sky", category: "Sikkim" },
  { src: u("photo-1593693397690-362cb9666fc2"), alt: "Darjeeling toy train winding through a hillside town", category: "Darjeeling" },
  { src: u("photo-1626621341517-bbf3d9990a23"), alt: "Monastery prayer flags fluttering against mountain backdrop", category: "Sikkim" },
  { src: u("photo-1602088113235-229c19758e9f"), alt: "Rolling tea garden slopes in the Darjeeling hills", category: "Darjeeling" },
  { src: u("photo-1580655653885-65763b2597d0"), alt: "Alpine valley with a river running through forested mountains", category: "Sikkim" },
  { src: u("photo-1566837945700-30057527ade0"), alt: "Misty hill town rooftops at dawn", category: "Kalimpong" },
  { src: u("photo-1533473359331-0135ef1b58bf"), alt: "Car on a winding mountain highway", category: "Vehicles" },
  { src: u("photo-1470770903676-69b98201ea1c"), alt: "Lakeside mountain campsite at dusk", category: "Travel" },
  { src: u("photo-1512100356356-de1b84283e18"), alt: "Colourful hillside houses on a steep green slope", category: "Darjeeling" },
  { src: u("photo-1573459353208-05d2f14e57d4"), alt: "High-altitude lake reflecting surrounding snow peaks", category: "Sikkim" },
  { src: u("photo-1608083950849-53a6a6dc0b02"), alt: "Sunrise over layered mountain ridges", category: "Travel" },
  { src: u("photo-1587061949409-02df41d5e562"), alt: "Suspension bridge over a forested river gorge", category: "Sikkim" },
  { src: u("photo-1595815771614-ade9d652a65d"), alt: "Quiet hill road lined with pine trees", category: "Kalimpong" },
  { src: u("photo-1544620347-c4fd4a3d5957"), alt: "Spacious traveller vehicle parked at a mountain viewpoint", category: "Vehicles" },
  { src: u("photo-1502786129293-79981df4e689"), alt: "Trekker walking a mountain trail at golden hour", category: "Travel" },
];
