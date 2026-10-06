import type { Recap } from "video-util";

export type YouTubeVideoMetadata = {
  title: string;
  channel: string;
};

export type YouTubeMetadataClient = (
  video: Recap["video"],
) => Promise<YouTubeVideoMetadata | null>;

const oembedUrl = (url: string) => {
  const params = new URLSearchParams({ url, format: "json" });

  return `https://www.youtube.com/oembed?${params.toString()}`;
};

export const fetchYouTubeVideoMetadata: YouTubeMetadataClient = async (
  video,
) => {
  try {
    const response = await fetch(oembedUrl(video.url));

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      title?: unknown;
      author_name?: unknown;
    };

    if (
      typeof body.title !== "string" ||
      typeof body.author_name !== "string"
    ) {
      return null;
    }

    return { title: body.title, channel: body.author_name };
  } catch {
    return null;
  }
};
