const ENDPOINT = "https://api.unsplash.com/search/photos";

const ONE_WEEK = 60 * 60 * 24 * 7;

// Stable, public Unsplash CDN URL used when the API is unavailable.
// Direct images.unsplash.com URLs do not require an access key.
const GLOBAL_FALLBACK =
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80";

function preferredFallback(fallback: string): string {
  if (!fallback) return GLOBAL_FALLBACK;
  // The legacy source.unsplash.com/featured endpoint was retired in 2024 and
  // now reliably 404s. Skip it and use the global fallback instead.
  if (fallback.includes("source.unsplash.com")) return GLOBAL_FALLBACK;
  return fallback;
}

export async function searchPhoto(
  query: string,
  fallback: string,
): Promise<string> {
  const safeFallback = preferredFallback(fallback);
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.warn(
      `[unsplash] UNSPLASH_ACCESS_KEY is not set — using fallback for "${query}"`,
    );
    return safeFallback;
  }

  try {
    const url = `${ENDPOINT}?query=${encodeURIComponent(
      query,
    )}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: ONE_WEEK },
    });
    if (!res.ok) {
      console.warn(
        `[unsplash] ${res.status} ${res.statusText} for "${query}"`,
      );
      return safeFallback;
    }
    const data = (await res.json()) as {
      results?: Array<{ urls?: { regular?: string } }>;
    };
    const photo = data.results?.[0]?.urls?.regular;
    if (typeof photo !== "string") {
      console.warn(`[unsplash] no result for "${query}"`);
      return safeFallback;
    }
    return photo;
  } catch (err) {
    console.error(`[unsplash] fetch error for "${query}":`, err);
    return safeFallback;
  }
}

export async function resolveDishPhotos<T extends { name: string; image: string }>(
  items: T[],
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      image: await searchPhoto(`${item.name} dish`, item.image),
    })),
  );
}
