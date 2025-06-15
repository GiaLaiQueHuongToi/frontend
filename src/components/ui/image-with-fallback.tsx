"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

// Custom Image component with fallback handling
export const ImageWithFallback = ({ 
  src, 
  alt, 
  segmentId,
  loadDelay = 0, // New prop for staggered loading
  ...props 
}: { 
  src: string; 
  alt: string; 
  segmentId: number;
  loadDelay?: number; // Delay in milliseconds before starting to load
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState("");
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldStartLoading, setShouldStartLoading] = useState(false);

  // Staggered loading effect - wait before starting to load Pollinations images
  useEffect(() => {
    if (src.includes('pollinations') && loadDelay > 0) {
      console.log(`⏳ Delaying Pollinations image load for segment ${segmentId} by ${loadDelay}ms`);
      const delayTimeout = setTimeout(() => {
        console.log(`🚀 Starting delayed load for segment ${segmentId}`);
        setImgSrc(src);
        setShouldStartLoading(true);
      }, loadDelay);

      return () => clearTimeout(delayTimeout);
    } else {
      // Load immediately for non-Pollinations images or no delay
      setImgSrc(src);
      setShouldStartLoading(true);
    }
  }, [src, segmentId, loadDelay]);

  const handleError = () => {
    console.log(`❌ Image error for segment ${segmentId}, fallback level: ${fallbackLevel}`);
    console.log(`Current src: ${imgSrc}`);
    console.log(`Is Pollinations: ${imgSrc.includes('pollinations')}`);
    
    if (fallbackLevel === 0) {
      // If it's a Pollinations URL, try a different seed/approach first
      if (imgSrc.includes('pollinations')) {
        setFallbackLevel(1);
        // Extract the prompt from the original URL and try a different seed
        const urlParts = imgSrc.split('?');
        const baseUrl = urlParts[0];
        const newSeed = Math.floor(Math.random() * 10000);
        setImgSrc(`${baseUrl}?width=1920&height=1080&seed=${newSeed}&nologo=true`);
        console.log(`Retrying Pollinations with new seed: ${newSeed}`);
      } else {
        // For non-Pollinations URLs, try Picsum
        setFallbackLevel(1);
        const newImageId = 100 + (segmentId * 20) + Math.floor(Math.random() * 50);
        setImgSrc(`https://picsum.photos/1920/1080?random=${newImageId}`);
        console.log(`Trying Picsum fallback: ${newImageId}`);
      }
    } else if (fallbackLevel === 1) {
      // Second fallback: try a reliable placeholder service
      setFallbackLevel(2);
      const colors = ['4285f4', 'ea4335', '34a853', 'fbbc04', '9c27b0'];
      const color = colors[segmentId % colors.length];
      const newSrc = `https://via.placeholder.com/1920x1080/${color}/ffffff?text=Segment+${segmentId}`;
      setImgSrc(newSrc);
      console.log(`Trying placeholder service: ${newSrc}`);
    } else if (fallbackLevel === 2) {
      // Third fallback: use local placeholder
      setFallbackLevel(3);
      setImgSrc('/placeholder-video.svg');
      console.log(`Using local placeholder: /placeholder-video.svg`);
    } else {
      // Final fallback: use generic placeholder
      setImgSrc('/placeholder.svg');
      console.log(`Final fallback: /placeholder.svg`);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    console.log(`✓ Image loaded successfully for segment ${segmentId}: ${imgSrc}`);
  };

  return (
    <div className="relative w-full h-full">
      {(!shouldStartLoading || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
            <div className="text-xs text-gray-500">
              {!shouldStartLoading ? `Waiting... (${Math.floor(loadDelay/1000)}s)` : 'Loading...'}
            </div>
          </div>
        </div>
      )}
      {shouldStartLoading && imgSrc && (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover"
          onError={handleError}
          onLoad={handleLoad}
          unoptimized // For external URLs
          {...props}
        />
      )}
    </div>
  );
};