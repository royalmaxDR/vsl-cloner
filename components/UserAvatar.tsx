import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function UserAvatar({ 
  src, 
  name, 
  size = 40,
  className = ''
}: { 
  src?: string, 
  name: string, 
  size?: number,
  className?: string
}) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center font-bold text-slate-300 bg-slate-800 border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center relative ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={src} 
        alt={name} 
        width={size} 
        height={size} 
        className="object-cover w-full h-full"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
