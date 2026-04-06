'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';

interface SmartImageProps {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}

export default function SmartImage({ src, fallback, alt, className }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usedFallback, setUsedFallback] = useState(false);
  const [isLowRes, setIsLowRes] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setUsedFallback(false);
    setIsLowRes(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!usedFallback) {
      setCurrentSrc(fallback);
      setUsedFallback(true);
      setIsLowRes(false);
      return;
    }

    // If both primary and fallback fail, keep showing fallback URL.
    setCurrentSrc(fallback);
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    // Very small source logos look blurry when stretched.
    setIsLowRes(img.naturalWidth < 96 || img.naturalHeight < 96);
  };

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={isLowRes ? { width: '72%', height: '72%' } : undefined}
    />
  );
}
