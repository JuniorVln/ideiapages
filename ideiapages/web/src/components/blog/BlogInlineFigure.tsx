import Image from "next/image";

interface BlogInlineFigureProps {
  src: string | null;
  alt: string;
  credit: string | null;
}

const PEXELS_HOST = "images.pexels.com";

export function BlogInlineFigure({ src, alt, credit }: BlogInlineFigureProps) {
  if (!src) return null;

  return (
    <figure className="sales-inline-figure not-prose max-w-none w-[calc(100%+2rem)] -mx-4 sm:w-[calc(100%+3rem)] sm:-mx-6 md:w-[calc(100%+4rem)] md:-mx-8 my-10 rounded-2xl overflow-hidden border border-border bg-surface-alt shadow-card">
      <div className="relative aspect-[21/9] min-h-[200px] bg-slate-100">
        {src.includes(PEXELS_HOST) ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 75rem"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      {credit ? (
        <figcaption className="px-4 py-2 text-xs text-text-subtle text-center bg-white/80">
          Foto: {credit} · Pexels
        </figcaption>
      ) : null}
    </figure>
  );
}
