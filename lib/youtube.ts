export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
};

export async function getPlaylistVideos(playlistId: string): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const videoIds = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((m) => m[1]);
    const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]);
    // First <title> in the feed is the channel name, skip it
    return videoIds.map((id, i) => ({
      id,
      title: titles[i + 1] ?? "",
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    }));
  } catch {
    return [];
  }
}
