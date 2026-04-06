'use client';

import { useState } from 'react';

interface SmartImageProps {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}

export default function SmartImage({ src, fallback, alt, className }: SmartImageProps) {
  const [hasError, setHasError] = useState(false);

  // If the src changes, reset the error state
  // We can also use a key={src} on the component from the parent
  // But here we'll just handle it by choosing the src to render
  
  const handleError = () => {
    setHasError(true);
  };

  return (
    <img 
      src={hasError ? fallback : src} 
      alt={alt} 
      className={className}
      onError={handleError}
    />
  );
}
