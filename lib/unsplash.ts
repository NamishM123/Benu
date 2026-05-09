const ENDPOINT = "https://api.unsplash.com/search/photos";

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function searchPhoto(
  query: string,
  fallback: string,
): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return fallback;

  try {
    const url = `${ENDPOINT}?query=${encodeURIComponent(
      query,
    )}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: ONE_WEEK },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      results?: Array<{ urls?: { regular?: string } }>;
    };
    const photo = data.results?.[0]?.urls?.regular;
    return typeof photo === "string" ? photo : fallback;
  } catch {
    return fallback;
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
