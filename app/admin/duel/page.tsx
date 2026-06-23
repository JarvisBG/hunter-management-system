'use client';

import { useState, useMemo } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Fausses données pour le test
const MOCK_SURVIVORS = [
  { id: '405', name: 'Gon Freecss',    photo: 'https://i.pinimg.com/736x/87/a7/6c/87a76c66914562c5e5330de9910dd2b6.jpg' },
  { id: '294', name: 'Hanzo',          photo: 'https://i.pinimg.com/736x/1d/a3/de/1da3de166e5f385c9636a2cd8b3f81e7.jpg' },
  { id: '99',  name: 'Killua Zoldyck', photo: 'https://i.pinimg.com/736x/a2/e8/cf/a2e8cfaeb63b3ea595d2c2b3e8e19c3d.jpg' },
  { id: '53',  name: 'Pokkle',         photo: 'https://i.pinimg.com/736x/e4/cc/ba/e4ccbaf915c267ef22a76f28b4de88bb.jpg' },
];

type Survivor = (typeof MOCK_SURVIVORS)[0];
type Duel = {
  id: string;
  fighter1: Survivor;
  fighter2: Survivor;
  winnerId: string | null;
};

// Coin de visée réutilisable
function Reticle({ color = '#D9A441', size = 10 }: { color?: string; size?: number }) {
  const s = size;
  const b = 2;
  return (
    <>
      <span style={{ position: 'absolute', top: -1, left: -1, width: s, height: s, borderTop: `${b}px solid ${color}`, borderLeft: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', top: -1, right: -1, width: s, height: s, borderTop: `${b}px solid ${color}`, borderRight: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', bottom: -1, left: -1, width: s, height: s, borderBottom: `${b}px solid ${color}`, borderLeft: `${b}px solid ${color}` }} />
      <span style={{ position: 'absolute', bottom: -1, right: -1, width: s, height: s, borderBottom: `${b}px solid ${color}`, borderRight: `${b}px solid ${color}` }} />
    </>
  );
}

export default function DuelManager() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const stats = useMemo(() => ({
    total:    duels.length,
    resolved: duels.filter(d => d.winnerId !== null).length,
    pending:  duels.filter(d => d.winnerId === null).length,
  }), [duels]);

  const generateDuels = () => {
    const shuffled = [...MOCK_SURVIVORS].sort(() => 0.5 - Math.random());
    const newDuels: Duel[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        newDuels.push({
          id: `match-${i}`,
          fighter1: shuffled[i],
          fighter2: shuffled[i + 1],
          winnerId: null,
        });
      }
    }
    setDuels(newDuels);
    setIsGenerated(true);
  };

  const declareWinner = (duelId: string, fighterId: string) => {
    if (!window.confirm(`Confirmer le candidat #${fighterId} comme vainqueur ? L'autre sera éliminé.`)) return;
    setDuels(prev =>
      prev.map(d => (d.id === duelId ? { ...d, winnerId: fighterId } : d))
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30">
      {/* Scanline ambiante */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] z-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }}
      />
      {/* Vignette or */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at top, rgba(217,164,65,0.06), transparent 55%)' }}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#232931] pb-6 mb-10">
          <div>
            <p className={`${mono.className} text-[#D9A441]/70 text-xs tracking-[0.2em] mb-2`}>
              &gt; ÉCRAN GM — ÉTAPE II_
            </p>
            <h1 className={`${display.className} text-4xl md:text-5xl font-bold text-[#F2EFE9] tracking-wide uppercase`}>
              HMS <span className="text-[#E0524F]">// DUELS</span>
            </h1>
            <p className={`${mono.className} text-[#6B7178] text-xs mt-2 tracking-wide`}>
              Affrontements aléatoires · Validation en temps réel
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isGenerated && (
              <div className="flex items-stretch gap-px bg-[#232931] rounded-lg overflow-hidden border border-[#232931]">
                {[
                  { label: 'Total',    value: stats.total,    color: 'text-[#E8E6E1]' },
                  { label: 'Résolus', value: stats.resolved, color: 'text-[#5FA876]'  },
                  { label: 'Attente', value: stats.pending,  color: 'text-[#D9A441]'  },
                ].map(s => (
                  <div key={s.label} className="bg-[#0E1115] px-4 py-2.5 min-w-[80px]">
                    <p className={`${mono.className} text-[9px] uppercase tracking-widest text-[#6B7178] mb-0.5`}>{s.label}</p>
                    <p className={`${mono.className} text-xl font-bold ${s.color}`}>{String(s.value).padStart(2, '0')}</p>
                  </div>
                ))}
              </div>
            )}
            <a
              href="/admin"
              className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441] border border-[#232931] hover:border-[#D9A441]/50 px-4 py-2 rounded-lg transition-all`}
            >
              ← Retour au Radar
            </a>
          </div>
        </header>

        {/* État vide — avant génération */}
        {!isGenerated ? (
          <div className="bg-[#11151A] border border-[#232931] p-10 md:p-16 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E0524F] via-[#E0524F]/40 to-transparent" />

            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full bg-[#1A1E23] border border-[#2A3038] flex items-center justify-center text-5xl">
                🥷
              </div>
              <Reticle color="#E0524F" size={14} />
            </div>

            <h2 className={`${display.className} text-3xl text-[#F2EFE9] mb-2 uppercase tracking-wider`}>
              {MOCK_SURVIVORS.length} Combattants en lice
            </h2>
            <p className={`${mono.className} text-[#6B7178] text-sm mb-10 max-w-md mx-auto leading-relaxed`}>
              L&apos;algorithme va créer des paires aléatoires. Les téléphones des candidats s&apos;actualiseront pour afficher leur adversaire.
            </p>
            <button
              onClick={generateDuels}
              className={`${display.className} bg-[#E0524F] hover:bg-[#C4403D] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0524F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151A]`}
            >
              Générer le Tableau de Combat
            </button>
          </div>
        ) : (
          /* Liste des duels */
          <div className="space-y-5">
            {duels.map((duel, index) => {
              const resolved   = duel.winnerId !== null;
              const allPending = !resolved;

              return (
                <div
                  key={duel.id}
                  className={`bg-[#11151A] border rounded-2xl overflow-hidden transition-all duration-500 ${
                    resolved ? 'border-[#232931] opacity-80' : 'border-[#232931] hover:border-[#E0524F]/30'
                  }`}
                >
                  {/* Bandeau titre du match */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1A1E23]">
                    <p className={`${mono.className} text-[#6B7178] text-[10px] font-bold tracking-[0.25em] uppercase`}>
                      Match {String(index + 1).padStart(2, '0')}
                    </p>
                    {resolved ? (
                      <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#5FA876]/10 text-[#5FA876] border-[#5FA876]/30`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5FA876]" />
                        Résolu
                      </span>
                    ) : (
                      <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#E0524F]/10 text-[#E0524F] border-[#E0524F]/30`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E0524F]" />
                        </span>
                        En attente
                      </span>
                    )}
                  </div>

                  {/* Arena */}
                  <div className="flex flex-col md:flex-row items-stretch gap-0 relative">
                    
                    {/* Fighter 1 */}
                    <FighterCard
                      fighter={duel.fighter1}
                      state={
                        duel.winnerId === duel.fighter1.id ? 'winner'
                          : duel.winnerId === duel.fighter2.id ? 'loser'
                          : 'pending'
                      }
                      onClick={() => allPending && declareWinner(duel.id, duel.fighter1.id)}
                      disabled={resolved}
                      mono={mono.className}
                      display={display.className}
                    />

                    {/* VS */}
                    <div className="flex items-center justify-center px-4 py-6 md:py-0 flex-shrink-0 z-10">
                      <div className="relative">
                        <div
                          className={`${display.className} text-4xl font-black italic select-none ${
                            resolved ? 'text-[#2A3038]' : 'text-[#E0524F]'
                          }`}
                        >
                          VS
                        </div>
                        {!resolved && (
                          <div
                            className="absolute inset-0 blur-2xl opacity-30 text-4xl font-black italic text-[#E0524F]"
                            aria-hidden
                          >
                            VS
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fighter 2 */}
                    <FighterCard
                      fighter={duel.fighter2}
                      state={
                        duel.winnerId === duel.fighter2.id ? 'winner'
                          : duel.winnerId === duel.fighter1.id ? 'loser'
                          : 'pending'
                      }
                      onClick={() => allPending && declareWinner(duel.id, duel.fighter2.id)}
                      disabled={resolved}
                      mono={mono.className}
                      display={display.className}
                      reverse
                    />
                  </div>
                </div>
              );
            })}

            {/* Bouton de re-génération */}
            {stats.pending === 0 && stats.total > 0 && (
              <div className="pt-4 text-center">
                <button
                  onClick={generateDuels}
                  className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441] border border-[#232931] hover:border-[#D9A441]/50 px-6 py-3 rounded-lg transition-all uppercase tracking-widest`}
                >
                  Relancer un nouveau tirage
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/* Composant carte combattant                      */
/* ────────────────────────────────────────────── */
type FighterState = 'pending' | 'winner' | 'loser';

function FighterCard({
  fighter, state, onClick, disabled, mono, display, reverse = false,
}: {
  fighter: { id: string; name: string; photo: string };
  state: FighterState;
  onClick: () => void;
  disabled: boolean;
  mono: string;
  display: string;
  reverse?: boolean;
}) {
  const containerCls = {
    pending: 'bg-[#0E1115] border-[#232931] hover:border-[#D9A441]/50 hover:bg-[#13171C] cursor-pointer group',
    winner:  'bg-[#5FA876]/10 border-[#5FA876]/60 shadow-[0_0_20px_rgba(95,168,118,0.15)] cursor-default',
    loser:   'bg-[#1A0E0E] border-[#E0524F]/20 opacity-50 grayscale cursor-default',
  }[state];

  const reticleColor = state === 'winner' ? '#5FA876' : '#D9A441';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 border rounded-xl m-3 md:m-4 p-4 transition-all duration-300 ${containerCls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151A]`}
    >
      <div className={`flex items-center gap-4 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Photo avec reticle */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-full h-full rounded-md bg-[#1A1E23] border border-[#232931] overflow-hidden">
            <img
              src={fighter.photo}
              alt={fighter.name}
              className="w-full h-full object-cover"
            />
          </div>
          {(state === 'winner' || state === 'pending') && (
            <Reticle color={reticleColor} size={10} />
          )}
          {state === 'winner' && (
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#5FA876] border-2 border-[#11151A] flex items-center justify-center text-[9px]">
              ✓
            </div>
          )}
        </div>

        {/* Infos */}
        <div className={`flex-1 min-w-0 ${reverse ? 'text-right' : 'text-left'}`}>
          <p className={`${mono} text-[#D9A441] text-[10px] tracking-wider`}>#{fighter.id}</p>
          <p className={`${display} text-[#F2EFE9] text-xl uppercase leading-tight truncate`}>{fighter.name}</p>
          {state === 'pending' && (
            <p className={`${mono} text-[10px] text-[#4A5057] group-hover:text-[#D9A441] transition-colors mt-1 uppercase tracking-wider`}>
              → Déclarer vainqueur
            </p>
          )}
          {state === 'winner' && (
            <p className={`${mono} text-[10px] text-[#5FA876] mt-1 uppercase tracking-wider`}>Vainqueur</p>
          )}
          {state === 'loser' && (
            <p className={`${mono} text-[10px] text-[#E0524F] mt-1 uppercase tracking-wider`}>Éliminé</p>
          )}
        </div>
      </div>
    </button>
  );
}