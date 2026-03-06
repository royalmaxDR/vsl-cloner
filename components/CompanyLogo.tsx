import { useState } from 'react';
import Image from 'next/image';

export default function CompanyLogo({ 
  src, 
  name, 
  size = 56 
}: { 
  src: string, 
  name: string, 
  size?: number 
}) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div 
        className="rounded-2xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-slate-800 to-black border border-white/10"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden bg-white border border-white/10 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Using standard img instead of next/image to avoid server-side DNS resolution issues with external domains */}
      <img 
        src={src} 
        alt={name} 
        width={size} 
        height={size} 
        className="object-contain p-1"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
