'use client';

import { useState } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// --- FAUSSES DONNÉES : Uniquement les éliminés ---
const ELIMINATED_MOCKS = [
  { id: '44', name: 'Hisoka Morow', photo: 'https://i.pinimg.com/736x/bd/ec/bd/bdecbda1e53ec9d9ff7b5791694f4df7.jpg', reason: 'Disqualification (Agressivité)' },
  { id: '16', name: 'Tonpa', photo: 'https://i.pinimg.com/736x/55/e8/dd/55e8dd415b3aabce8beab0af77983636.jpg', reason: 'Abandon (Course d\'endurance)' },
  { id: '294', name: 'Hanzo', photo: 'https://i.pinimg.com/736x/1d/a3/de/1da3de166e5f385c9636a2cd8b3f81e7.jpg', reason: 'Échec (Cuisine)' },
];

// ─── Coin de visée ────────────────────────────────────────────────────────────
function Reticle({ color, size = 12 }: { color: string; size?: number }) {
  const b = 2;
  return (
    <>
      <span style={{ position: 'absolute', top: -2, left: -2, width: size, height: size, borderTop: `${b}px solid ${color}`, borderLeft: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', top: -2, right: -2, width: size, height: size, borderTop: `${b}px solid ${color}`, borderRight: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', bottom: -2, left: -2, width: size, height: size, borderBottom: `${b}px solid ${color}`, borderLeft: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', bottom: -2, right: -2, width: size, height: size, borderBottom: `${b}px solid ${color}`, borderRight: `${b}px solid ${color}` }} />
    </>
  );
}

export default function RescueTerminal() {
  const [eliminated, setEliminated] = useState(ELIMINATED_MOCKS);
  const [rescuingId, setRescuingId] = useState<string | null>(null);

  const handleRescue = (id: string, name: string) => {
    if (!window.confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir annuler l'élimination de ${name} et le réintégrer à l'examen ?`)) return;

    // Animation de réanimation
    setRescuingId(id);

    setTimeout(() => {
      // Retire le candidat de la liste des éliminés (dans la vraie app, ça fera un update Supabase status='active')
      setEliminated(eliminated.filter(c => c.id !== id));
      setRescuingId(null);
      alert(`PROTOCOLE OVERRIDE : Le candidat #${id} (${name}) a été réintégré avec succès.`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 p-4 md:p-8">
      {/* Texture scanline ambiante */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse at top, rgba(224,82,79,0.05), transparent 55%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* En-tête */}
        <header className="mb-10 text-center border-b border-[#232931] pb-8">
          <p className={`${mono.className} text-[#E0524F] text-xs tracking-[0.2em] mb-2 flex items-center justify-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-[#E0524F] animate-pulse" />
            ACCÈS RESTREINT // GOD MODE
          </p>
          <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] uppercase tracking-wider`}>
            Protocole <span className="text-[#D9A441]">d'Amnistie</span>
          </h1>
          <p className={`${mono.className} text-[#6B7178] text-sm mt-3`}>
            Archive des candidats éliminés. Forcez leur réintégration en cas d'erreur ou d'épreuve secrète validée.
          </p>
        </header>

        {eliminated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#232931] rounded-2xl bg-[#0B0E11]">
            <span className="text-4xl mb-4 opacity-50">🪦</span>
            <p className={`${mono.className} text-[#6B7178] text-sm uppercase tracking-widest`}>Aucun candidat éliminé</p>
            <p className={`${mono.className} text-[#4A5057] text-xs mt-2`}>Les archives de la morgue sont vides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eliminated.map((candidate) => {
              const isRescuing = rescuingId === candidate.id;

              return (
                <div 
                  key={candidate.id} 
                  className={`relative bg-[#11151A] p-5 rounded-2xl transition-all duration-700 ${
                    isRescuing 
                      ? 'border-2 border-[#D9A441] shadow-[0_0_30px_rgba(217,164,65,0.4)] scale-105' 
                      : 'border border-[#E0524F]/30 hover:border-[#E0524F]/60'
                  }`}
                >
                  {isRescuing && <Reticle color="#D9A441" size={16} />}
                  {!isRescuing && <Reticle color="#E0524F" size={8} />}

                  {/* Effet de scanline vert/or pendant la réanimation */}
                  {isRescuing && (
                    <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-[#D9A441]/20 to-transparent animate-scanline pointer-events-none rounded-2xl" />
                  )}

                  <div className={`flex flex-col items-center text-center transition-all duration-700 ${isRescuing ? 'grayscale-0' : 'grayscale opacity-70'}`}>
                    
                    <div className="relative w-24 h-24 mb-4">
                      <div className={`w-full h-full rounded-xl overflow-hidden border-2 ${isRescuing ? 'border-[#D9A441]' : 'border-[#E0524F]/50'}`}>
                        <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                      </div>
                      {!isRescuing && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <span className="text-5xl text-[#E0524F] font-black opacity-60">X</span>
                         </div>
                      )}
                    </div>

                    <p className={`${mono.className} text-[10px] font-bold tracking-widest mb-1 ${isRescuing ? 'text-[#D9A441]' : 'text-[#E0524F]'}`}>
                      #{candidate.id}
                    </p>
                    <h3 className={`${display.className} text-xl text-[#F2EFE9] uppercase mb-3`}>
                      {candidate.name}
                    </h3>

                    <div className="bg-[#0B0E11] w-full p-3 rounded-lg border border-[#232931] mb-6">
                      <p className={`${mono.className} text-[#6B7178] text-[9px] uppercase mb-1`}>Motif de l'élimination :</p>
                      <p className="text-xs text-[#C5C2BB] italic">"{candidate.reason}"</p>
                    </div>

                    <button 
                      onClick={() => handleRescue(candidate.id, candidate.name)}
                      disabled={isRescuing}
                      className={`${display.className} w-full py-3 rounded-xl uppercase tracking-widest font-bold transition-all ${
                        isRescuing 
                          ? 'bg-[#D9A441] text-[#0B0E11]' 
                          : 'bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/50 hover:bg-[#E0524F] hover:text-[#0B0E11]'
                      }`}
                    >
                      {isRescuing ? 'Restauration en cours...' : 'Révoquer l\'élimination'}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ajout d'une petite animation CSS personnalisée pour le scan de réanimation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 1.5s linear infinite;
        }
      `}} />
    </div>
  );
}