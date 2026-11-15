import { SmartImage } from './smart-image';
import { imageSources } from '../../lib/image-sources';

type SceneId = 'rural' | 'urban' | 'voice' | 'plumbing' | 'gps' | 'agri' | 'rewards';

type PhotoBannerProps = {
  scene: SceneId;
  alt: string;
  caption: string;
  className?: string;
};

/** A real scene photo with an accessible local fallback and caption overlay. */
export function PhotoBanner({ scene, alt, caption, className = '' }: PhotoBannerProps) {
  const image = {
    rural: imageSources.rural,
    urban: imageSources.urban,
    voice: imageSources.community,
    plumbing: imageSources.home,
    gps: imageSources.streets,
    agri: imageSources.agriculture,
    rewards: imageSources.artisan,
  }[scene];

  return (
    <figure className={`relative isolate h-36 overflow-hidden rounded-2xl border border-border shadow-sm sm:h-44 ${className}`}>
      <SmartImage src={image} alt={alt} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
      <figcaption className="absolute bottom-4 left-4 max-w-sm text-sm font-semibold text-white drop-shadow sm:bottom-5 sm:left-6 sm:text-base">
        {caption}
      </figcaption>
    </figure>
  );
}
