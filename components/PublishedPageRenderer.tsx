'use client';

import type { ExtractedData, Customizations, PlayerData, TrackingData } from '@/lib/supabase';
import { useEffect } from 'react';

interface Props {
  extracted: ExtractedData | null;
  customizations: Customizations | null;
  projectName: string;
}

export default function PublishedPageRenderer({ extracted, customizations, projectName }: Props) {
  const player = extracted?.player as PlayerData | null;
  const tracking = extracted?.tracking as TrackingData | null;
  const checkout = extracted?.checkout;
  const cta = extracted?.cta;
  const page = extracted?.page;

  // Effective values (customizations override extracted)
  const effectiveCheckout = customizations?.checkoutUrl || checkout?.primaryLink || '#';
  const effectivePixelId = customizations?.facebookPixelId || tracking?.facebookPixelId;
  const effectiveTitle = customizations?.headlineText || page?.title || projectName;
  const effectiveSubtitle = customizations?.subheadlineText || page?.description || '';
  const effectiveCtaText = customizations?.ctaButtonText || cta?.buttons?.[0]?.text || 'QUERO COMPRAR AGORA';

  // Inject Facebook Pixel
  useEffect(() => {
    if (!effectivePixelId) return;

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${effectivePixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, [effectivePixelId]);

  // CTA delay logic
  useEffect(() => {
    const delay = cta?.delay;
    if (!delay) return;

    const ctaElements = document.querySelectorAll('[data-cta-button]');
    ctaElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    const timer = setTimeout(() => {
      ctaElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
        (el as HTMLElement).style.animation = 'fadeIn 0.5s ease-in';
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [cta?.delay]);

  const renderPlayer = () => {
    if (!player || player.type === 'unknown') {
      return (
        <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
          <p className="text-white/50 text-sm">Player de vídeo não identificado</p>
        </div>
      );
    }

    if (player.type === 'convertai' && player.scriptSrc) {
      return (
        <div className="w-full aspect-video relative">
          {player.posterUrl && (
            <img
              src={player.posterUrl}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
          )}
          <div
            id="convertai-player"
            data-player-id={player.playerId}
            data-video-id={player.videoId}
            data-organization-id={player.organizationId}
            className="w-full h-full"
          />
          <script src={player.scriptSrc} async />
        </div>
      );
    }

    if (player.type === 'vturb' && player.scriptSrc) {
      return (
        <div className="w-full aspect-video relative">
          {player.posterUrl && (
            <img
              src={player.posterUrl}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
          )}
          <div
            id="vturb-player"
            data-vid={player.videoId}
            className="w-full h-full"
          />
          <script src={player.scriptSrc} async />
        </div>
      );
    }

    if (player.type === 'smartplayer' && player.scriptSrc) {
      return (
        <div className="w-full aspect-video relative">
          {player.posterUrl && (
            <img
              src={player.posterUrl}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
          )}
          <div
            id="smartplayer"
            data-id={player.playerId}
            className="w-full h-full"
          />
          <script src={player.scriptSrc} async />
        </div>
      );
    }

    // Fallback: show m3u8 in native video if available
    if (player.m3u8Urls.length > 0) {
      return (
        <video
          className="w-full aspect-video rounded-lg bg-black"
          controls
          poster={player.posterUrl || undefined}
        >
          <source src={player.m3u8Urls[0]} type="application/x-mpegURL" />
          Seu navegador não suporta este formato de vídeo.
        </video>
      );
    }

    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
        {player.posterUrl ? (
          <img src={player.posterUrl} alt="Video" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <p className="text-white/50 text-sm">Vídeo não disponível</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Headline */}
        {effectiveTitle && (
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 leading-tight">
            {effectiveTitle}
          </h1>
        )}

        {effectiveSubtitle && (
          <p className="text-center text-gray-400 mb-6 text-base sm:text-lg">
            {effectiveSubtitle}
          </p>
        )}

        {/* Video Player */}
        <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
          {renderPlayer()}
        </div>

        {/* CTA Button */}
        <div className="text-center" data-cta-button>
          <a
            href={effectiveCheckout}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 hover:shadow-green-500/50"
          >
            {effectiveCtaText}
          </a>
        </div>

        {/* UTMify script */}
        {tracking?.utmify && (
          <script
            src="https://cdn.utmify.com.br/scripts/utms/latest.js"
            data-utmify-prevent-subids
            async
            defer
          />
        )}
      </main>
    </div>
  );
}
