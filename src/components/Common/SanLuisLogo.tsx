import React, { useState } from 'react';

interface SanLuisLogoProps {
  className?: string;
  size?: number | string;
}

export const SanLuisLogo: React.FC<SanLuisLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const style = size ? { width: size, height: size } : undefined;

  // Use base URL so it resolves correctly on root domains (Vercel) and subpaths (GitHub Pages)
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (imgFailed) {
    return (
      <div
        className={`bg-amber-400 text-slate-950 font-black rounded-xl flex flex-col items-center justify-center border-2 border-black select-none shadow-md ${className}`}
        style={style}
        title="San Luis de Quillota - Cantera Canaria"
      >
        <span className="text-[10px] tracking-tighter leading-none font-black uppercase">SLQ</span>
        <span className="text-[7px] tracking-widest leading-none font-bold opacity-80">1919</span>
      </div>
    );
  }

  return (
    <img 
      src={`${cleanBase}LOGO_SAN_LUIS_DE_QUILLOTA_OFICIAL.png`}
      alt="San Luis de Quillota - Escudo Oficial"
      crossOrigin="anonymous"
      className={`object-contain select-none shrink-0 drop-shadow-md ${className}`}
      style={style}
      onError={(e) => {
        e.currentTarget.onerror = null;
        // Attempt local secondary logo, or trigger SVG fallback if second fails
        const target = e.currentTarget;
        if (!target.dataset.triedFallback) {
          target.dataset.triedFallback = 'true';
          target.src = `${cleanBase}san-luis-logo.png`;
        } else {
          setImgFailed(true);
        }
      }}
    />
  );
};
