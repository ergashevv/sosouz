'use client';

import { useState, type SyntheticEvent } from 'react';

interface SmartImageProps {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}

export default function SmartImage({ src, fallback, alt, className }: SmartImageProps) {
  const resetKey = `${src}::${fallback}`;

  return (
    <SmartImageContent
      key={resetKey}
      src={src}
      fallback={fallback}
      alt={alt}
      className={className}
    />
  );
}

function SmartImageContent({ src, fallback, alt, className }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [isLowRes, setIsLowRes] = useState(false);

  const handleError = () => {
    if (!usedFallback) {
      setCurrentSrc(fallback);
      setUsedFallback(true);
      setIsLowRes(false);
      return;
    }

    // If both primary and fallback fail, render a stable local placeholder.
    setShowPlaceholder(true);
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    // Very small source logos look blurry when stretched.
    setIsLowRes(img.naturalWidth < 96 || img.naturalHeight < 96);
  };

  const placeholderLetter = alt.trim().charAt(0).toUpperCase() || '?';

  if (showPlaceholder) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className || ''} flex items-center justify-center rounded-md bg-neutral-100 text-neutral-500 font-bold`}
      >
        {placeholderLetter}
      </div>
    );
  }

  return (
    // Using a plain img here is intentional to keep fallback/referrer behavior predictable for dynamic logo sources.
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      referrerPolicy="no-referrer"
      style={isLowRes ? { width: '72%', height: '72%' } : undefined}
    />
  );
}
