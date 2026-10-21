import React from 'react';

interface SanLuisLogoProps {
  className?: string;
  size?: number | string;
}

export const SanLuisLogo: React.FC<SanLuisLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img 
      src="/LOGO_SAN_LUIS_DE_QUILLOTA_OFICIAL.png" 
      alt="San Luis de Quillota - Escudo Oficial"
      crossOrigin="anonymous"
      className={`object-contain select-none shrink-0 drop-shadow-md ${className}`}
      style={style}
      onError={(e) => {
        // Fallback if needed
        (e.target as HTMLImageElement).src = '/san-luis-logo.png';
      }}
    />
  );
};
