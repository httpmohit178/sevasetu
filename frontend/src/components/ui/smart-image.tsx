import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
};

/** External image with animated loading, graceful error state, and reduced-motion support. */
export function SmartImage({ src, alt, className, imageClassName, loading = 'lazy' }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('smart-image relative overflow-hidden bg-gradient-to-br from-emerald-100 via-amber-50 to-orange-100', className)}>
      {!loaded && !failed && <div aria-hidden="true" className="smart-image-shimmer absolute inset-0" />}
      {failed ? (
        <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-100 via-amber-50 to-orange-100 text-emerald-800">
          <div className="flex flex-col items-center gap-2"><ImageIcon size={30} aria-hidden="true" /><span className="px-3 text-center text-xs font-medium">{alt}</span></div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('smart-image-photo h-full w-full object-cover', loaded && 'smart-image-loaded', imageClassName)}
        />
      )}
    </div>
  );
}
