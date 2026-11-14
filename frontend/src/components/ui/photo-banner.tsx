import { SmartImage } from './smart-image';

type PhotoBannerProps = {
  src: string;
  alt: string;
  caption: string;
  className?: string;
};

/** Compact animated scene banner for page headers, with a caption that describes the photo. */
export function PhotoBanner({ src, alt, caption, className = '' }: PhotoBannerProps) {
  return (
    <figure className={`relative isolate h-32 overflow-hidden rounded-2xl border border-border shadow-sm sm:h-40 ${className}`}>
      <SmartImage src={src} alt={alt} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
      <figcaption className="absolute bottom-4 left-4 max-w-sm text-sm font-semibold text-white drop-shadow sm:bottom-5 sm:left-6 sm:text-base">
        {caption}
      </figcaption>
    </figure>
  );
}
