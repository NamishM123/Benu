import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasUnsplashKey = Boolean(process.env.UNSPLASH_ACCESS_KEY);
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  let unsplashCheck:
    | { ok: true; sampleUrl: string }
    | { ok: false; status?: number; error?: string } = {
    ok: false,
    error: "UNSPLASH_ACCESS_KEY not set",
  };

  if (hasUnsplashKey) {
    try {
      const res = await fetch(
        "https://api.unsplash.com/search/photos?query=noodles&per_page=1",
        {
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
          cache: "no-store",
        },
      );
      if (!res.ok) {
        unsplashCheck = { ok: false, status: res.status };
      } else {
        const data = (await res.json()) as {
          results?: Array<{ urls?: { regular?: string } }>;
        };
        const sample = data.results?.[0]?.urls?.regular;
        if (sample) unsplashCheck = { ok: true, sampleUrl: sample };
        else unsplashCheck = { ok: false, error: "no results" };
      }
    } catch (err) {
      unsplashCheck = {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      };
    }
  }

  return NextResponse.json({
    env: {
      UNSPLASH_ACCESS_KEY: hasUnsplashKey ? "set" : "missing",
      OPENAI_API_KEY: hasOpenAIKey ? "set" : "missing",
    },
    unsplash: unsplashCheck,
  });
}
