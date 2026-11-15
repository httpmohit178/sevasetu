import { SceneCard, type SceneId } from './scene-card';

type PhotoBannerProps = {
  scene: SceneId;
  alt: string;
  caption: string;
  className?: string;
};

/** Animated illustrated banner. Each scene is drawn in the app so it never depends on a remote photo. */
export function PhotoBanner({ scene, alt, caption, className = '' }: PhotoBannerProps) {
  return (
    <figure className={`relative isolate h-36 overflow-hidden rounded-2xl border border-border shadow-sm sm:h-44 ${className}`}>
      <SceneCard scene={scene} alt={alt} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
      <figcaption className="absolute bottom-4 left-4 max-w-sm text-sm font-semibold text-white drop-shadow sm:bottom-5 sm:left-6 sm:text-base">
        {caption}
      </figcaption>
    </figure>
  );
}
