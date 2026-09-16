export type Testimonial = {
  name: string;
  location: string;
  rating: number;
  text: string;
  /** Placeholder testimonials must be replaced with real client reviews before launch. */
  placeholder?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    name: "Subhashis Roy",
    location: "Kolkata, West Bengal",
    rating: 5,
    text: "Booked an Innova for a 5-day Sikkim trip with family from Bagdogra. The vehicle was clean, and our driver was very calm and knowledgeable on the mountain roads to Gangtok and Tsomgo. Prompt coordination throughout.",
  },
  {
    name: "Pooja & Amit Sharma",
    location: "Delhi NCR",
    rating: 5,
    text: "We wanted a relaxed Darjeeling & Kalimpong itinerary without waking up at 4 AM every single day. Safar Tours planned our days thoughtfully and arranged nice, peaceful stays. Transparent pricing and zero surprises.",
  },
  {
    name: "Rajarshi Sengupta",
    location: "Durgapur",
    rating: 5,
    text: "Used their car rental from NJP station for our parents visiting Darjeeling. The driver reached on time, helped with luggage, and drove very patiently. That peace of mind for elderly parents was worth everything.",
  },
];
