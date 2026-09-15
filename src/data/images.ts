const image = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`,
  alt,
});

/**
 * Central image registry.
 * Replace Unsplash photo IDs with real client photography when available —
 * every page pulls images from here, so swapping is a one-file change.
 */
export const images = {
  hero: image(
    "photo-1506905925346-21bda4d32df4",
    "Snow-capped Himalayan peaks under a clear blue sky"
  ),
  customTour: image(
    "photo-1488646953014-85cb44e25828",
    "Traveler looking over a map while planning a mountain journey"
  ),
  carRental: image(
    "photo-1533473359331-0135ef1b58bf",
    "Car driving on a winding hill road with mountain scenery"
  ),
  finalCta: image(
    "photo-1469474968028-56623f02e42e",
    "Sunlit Himalayan valley with layered mountain ridges"
  ),
  about: image(
    "photo-1503220317375-aaad61436b1b",
    "Travelers admiring a scenic Himalayan viewpoint"
  ),
  guides: image(
    "photo-1519681393784-d120267933ba",
    "Starry night sky over snow-covered Himalayan mountains"
  ),
};
