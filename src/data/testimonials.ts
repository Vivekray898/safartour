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
    name: "Guest Name",
    location: "City",
    rating: 5,
    text: "Placeholder testimonial — replace with a verified client review before launch. Describe the trip, the service received and what stood out about the experience.",
    placeholder: true,
  },
  {
    name: "Guest Name",
    location: "City",
    rating: 5,
    text: "Placeholder testimonial — replace with a verified client review before launch. Describe the trip, the service received and what stood out about the experience.",
    placeholder: true,
  },
  {
    name: "Guest Name",
    location: "City",
    rating: 5,
    text: "Placeholder testimonial — replace with a verified client review before launch. Describe the trip, the service received and what stood out about the experience.",
    placeholder: true,
  },
];
