type Props = {
  playlistId: string;
  title: string;
};

export default function YouTubePlaylistEmbed({ playlistId, title }: Props) {
  const src = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(
    playlistId
  )}`;

  return (
    <div className="aspect-video rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm">
      <iframe
        src={src}
        title={`${title} — YouTube playlist`}
        aria-label={`${title} — YouTube playlist player`}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
