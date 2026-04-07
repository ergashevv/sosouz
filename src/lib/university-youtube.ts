import { prisma } from "@/lib/prisma";
import { getYouTubeChannelOverride } from "@/lib/university-research-overrides";
import { fetchRecentVideosForChannel, type YoutubeVideoPreview } from "@/lib/youtube-data";

export type { YoutubeVideoPreview };

async function resolveUniversityYoutubeChannelId(universityName: string): Promise<string | null> {
  const fromOverride = getYouTubeChannelOverride(universityName);
  if (fromOverride) return fromOverride;

  const prefix = `${universityName}::`;
  try {
    const row = await prisma.universityDetails.findFirst({
      where: { university_name: { startsWith: prefix } },
      select: { youtube_channel_id: true },
    });
    const id = row?.youtube_channel_id?.trim();
    if (id && id.startsWith("UC") && id.length >= 20) return id;
  } catch {
    // ignore DB errors — page should still render
  }
  return null;
}

/** Resolves channel (overrides → DB) and loads recent videos when `YOUTUBE_DATA_API_KEY` is set. */
export async function getUniversityYoutubeVideos(
  universityName: string,
  maxResults = 6,
): Promise<YoutubeVideoPreview[] | null> {
  const channelId = await resolveUniversityYoutubeChannelId(universityName);
  if (!channelId) return null;
  return fetchRecentVideosForChannel(channelId, maxResults);
}
