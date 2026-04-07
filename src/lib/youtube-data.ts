export type YoutubeVideoPreview = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
};

/** Latest uploads from a channel (YouTube Data API v3 search.list). Requires `YOUTUBE_DATA_API_KEY`. */
export async function fetchRecentVideosForChannel(
  channelId: string,
  maxResults = 6,
): Promise<YoutubeVideoPreview[] | null> {
  const key = process.env.YOUTUBE_DATA_API_KEY;
  if (!key) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(Math.min(25, Math.max(1, maxResults))));
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    console.error("[youtube-data] API error", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const items = data.items;
  if (!Array.isArray(items)) return [];

  const out: YoutubeVideoPreview[] = [];
  for (const item of items) {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title;
    if (!videoId || !title) continue;
    const thumbnailUrl =
      item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "";
    out.push({
      videoId,
      title,
      thumbnailUrl,
      channelTitle: item.snippet?.channelTitle || "",
    });
  }
  return out;
}
