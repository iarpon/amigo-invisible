'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { EyeOff, Sparkles, Shield, Compass, Stamp, Lock } from 'lucide-react';

interface RevealCardProps {
  target: {
    id: string;
    name: string;
    phone: string;
    wishlist: string | null;
  };
  budget?: string | null;
}

export default function RevealCard({ target, budget }: RevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    if (!isRevealed) {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#d4a359', '#b91c1c', '#15803d', '#fef08a'],
      });
    }
    setIsRevealed(!isRevealed);
  };

  return (
    <div className="relative rounded-3xl bg-[#12201b] border-2 border-[#2a4537] shadow-2xl p-6 sm:p-8 overflow-hidden">
      {/* Corner vintage postal brackets */}
      <div className="absolute top-3 left-3 text-[#527060] font-mono text-xs select-none pointer-events-none">
        ┌─ ESTAFETA
      </div>
      <div className="absolute top-3 right-3 text-[#527060] font-mono text-xs select-none pointer-events-none">
        N.º 24-DIC ─┐
      </div>
      <div className="absolute bottom-3 left-3 text-[#527060] font-mono text-xs select-none pointer-events-none">
        └─ CIFRADO
      </div>
      <div className="absolute bottom-3 right-3 text-[#527060] font-mono text-xs select-none pointer-events-none">
        SECRETO ─┘
      </div>

      <div className="relative z-10 pt-4 pb-2">
        {/* Top Header metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#233c30]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#1c3027] text-[#d4a359] font-mono text-[10px] tracking-widest uppercase border border-[#355444]">
              <Stamp className="w-3 h-3 text-[#d4a359]" />
              PLIEGO DE ASIGNACIÓN CONFIDENCIAL
            </span>
          </div>

          {isRevealed && (
            <button
              onClick={handleReveal}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#93a79c] hover:text-[#f2efe9] bg-[#1a2d24] hover:bg-[#253e32] px-3 py-1.5 rounded-md border border-[#334f41] transition-all cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Volver a precintar</span>
            </button>
          )}
        </div>

        {/* SEALED STATE */}
        {!isRevealed ? (
          <div
            onClick={handleReveal}
            className="cursor-pointer group py-12 px-6 rounded-2xl bg-[#0e1a16] border border-dashed border-[#345343] hover:border-[#d4a359]/60 transition-all text-center flex flex-col items-center justify-center gap-4 select-none"
          >
            {/* The 3D Wax Seal Button */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full wax-seal flex items-center justify-center text-white font-serif font-bold text-2xl tracking-wider shadow-2xl group-hover:scale-108 transition-transform border-2 border-amber-300/40">
                <Lock className="w-7 h-7 text-amber-200" />
              </div>
              <div className="absolute -inset-1 rounded-full bg-amber-400/10 blur-sm group-hover:bg-amber-400/25 transition-all pointer-events-none" />
            </div>

            <div>
              <p className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#f5f2eb] group-hover:text-[#e4be77] transition-colors">
                Toca el sello para abrir tu despacho secreto
              </p>
              <p className="font-mono text-xs text-[#7e978b] mt-1.5">
                Clasificado: Únicamente para tus ojos. Nadie más debe mirar.
              </p>
            </div>
          </div>
        ) : (
          /* REVEALED DOSSIER STATE */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Parchment Dossier Card */}
            <div className="bg-[#fbf8f1] text-[#1c2923] rounded-2xl p-6 sm:p-8 shadow-xl border border-[#d9d1c1] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#942929] bg-[#f5e3e3] px-2.5 py-1 rounded-sm border border-[#e2bcbc] font-bold">
                    DESTINATARIO DE TU REGALO
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#112019] tracking-tight mt-2">
                    {target.name}
                  </h2>
                </div>

                {budget && (
                  <div className="sm:text-right">
                    <span className="font-mono text-[10px] uppercase text-[#697a71] block">
                      Presupuesto pactado
                    </span>
                    <span className="font-mono text-base font-bold text-[#14532d] bg-[#dcfce7] px-3 py-1 rounded-md border border-[#86efac] inline-block mt-0.5">
                      {budget}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#e8e0d0] flex flex-wrap items-center gap-3 text-xs text-[#4d5f55]">
                <span className="font-mono font-medium flex items-center gap-1.5 bg-[#f0ebd9] px-2.5 py-1 rounded-sm border border-[#ded5c0]">
                  <span>TEL:</span> {target.phone}
                </span>
                <span className="font-mono text-[11px] text-[#7c8b82]">
                  Estado: Asignación secreta confirmada
                </span>
              </div>
            </div>

            {/* Target's Wishlist Section */}
            <div className="bg-[#0e1a15] rounded-2xl p-5 border border-[#233d30]">
              <div className="flex items-center gap-2 mb-2.5">
                <Compass className="w-4 h-4 text-[#d4a359]" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#d4a359] font-bold">
                  Manifiesto de Pistas & Deseos de {target.name}:
                </h3>
              </div>

              {target.wishlist ? (
                <div className="bg-[#14251e] p-4 rounded-xl border border-[#274436]">
                  <p className="font-serif text-sm sm:text-base text-[#e8e4da] italic leading-relaxed">
                    &ldquo;{target.wishlist}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-[#7e978b] italic py-1">
                  {target.name} todavía no ha anotado pistas en su ficha. Puedes enviarle un cablegrama de incógnito en la sección de mensajería inferior para sonsacarle sus gustos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
