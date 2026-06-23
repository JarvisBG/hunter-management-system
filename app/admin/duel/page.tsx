'use client';

import { useState, useMemo, useEffect } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

type Candidate = { id: string; name: string; photo_url: string; status: string };
type Duel = {
  id: string;
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  fighter1?: Candidate;
  fighter2?: Candidate | null;
};

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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const fetchState = async () => {
    const { data: dData } = await supabase.from('duels').select('*').order('created_at', { ascending: true });
    const { data: cData } = await supabase.from('candidates').select('id, name, photo_url, status');
    
    if (cData) setCandidates(cData);
    
    if (dData && dData.length > 0 && cData) {
      const mappedDuels = dData.map((d: any) => ({
        ...d,
        fighter1: cData.find(c => c.id === d.player1_id),
        fighter2: d.player2_id ? cData.find(c => c.id === d.player2_id) : null
      }));
      setDuels(mappedDuels);
      setIsGenerated(true);
    } else {
      setDuels([]);
      setIsGenerated(false);
    }
  };

  useEffect(() => {
    fetchState();
    const channel = supabase
      .channel('duels_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels' }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => fetchState())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => ({
    total:    duels.length,
    resolved: duels.filter(d => d.status === 'completed').length,
    pending:  duels.filter(d => d.status === 'pending').length,
  }), [duels]);

  const generateDuels = async () => {
    if (!window.confirm("Générer les duels et réinitialiser le statut des candidats au combat ?")) return;
    
    const qualified = candidates.filter(c => c.status === 'qualified');
    if (qualified.length === 0) {
      alert("Aucun candidat qualifié !");
      return;
    }
    
    for (const c of qualified) {
      await supabase.from('candidates').update({ status: 'active' }).eq('id', c.id);
    }
    
    await supabase.from('duels').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    const shuffled = [...qualified].sort(() => 0.5 - Math.random());
    const newDuels = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        newDuels.push({ player1_id: shuffled[i].id, player2_id: shuffled[i + 1].id, status: 'pending' });
      } else {
        newDuels.push({ player1_id: shuffled[i].id, player2_id: null, status: 'pending' });
      }
    }
    
    await supabase.from('duels').insert(newDuels);
    fetchState();
  };

  const declareWinner = async (duelId: string, winnerId: string, loserId?: string | null) => {
    if (!window.confirm(`Confirmer le candidat #${winnerId} comme vainqueur ?`)) return;
    await supabase.from('duels').update({ winner_id: winnerId, status: 'completed' }).eq('id', duelId);
    await supabase.from('candidates').update({ status: 'qualified' }).eq('id', winnerId);
    if (loserId) {
      await supabase.from('candidates').update({ status: 'eliminated' }).eq('id', loserId);
    }
    fetchState();
  };

  const declareLoserSolo = async (duelId: string, loserId: string) => {
    if (!window.confirm(`Confirmer l'élimination du candidat #${loserId} ?`)) return;
    await supabase.from('duels').update({ status: 'completed' }).eq('id', duelId);
    await supabase.from('candidates').update({ status: 'eliminated' }).eq('id', loserId);
    fetchState();
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-20">
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse at top, rgba(217,164,65,0.06), transparent 55%)' }} />

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#232931] pb-6 mb-10">
          <div>
            <p className={`${mono.className} text-[#D9A441]/70 text-xs tracking-[0.2em] mb-2`}>&gt; ÉCRAN GM — ÉTAPE II_</p>
            <h1 className={`${display.className} text-4xl md:text-5xl font-bold text-[#F2EFE9] tracking-wide uppercase`}>HMS <span className="text-[#E0524F]">// DUELS</span></h1>
            <p className={`${mono.className} text-[#6B7178] text-xs mt-2 tracking-wide`}>Affrontements aléatoires · Validation en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            {isGenerated && (
              <div className="flex items-stretch gap-px bg-[#232931] rounded-lg overflow-hidden border border-[#232931]">
                {[ { label: 'Total', value: stats.total, color: 'text-[#E8E6E1]' }, { label: 'Résolus', value: stats.resolved, color: 'text-[#5FA876]' }, { label: 'Attente', value: stats.pending, color: 'text-[#D9A441]' } ].map(s => (
                  <div key={s.label} className="bg-[#0E1115] px-4 py-2.5 min-w-[80px]">
                    <p className={`${mono.className} text-[9px] uppercase tracking-widest text-[#6B7178] mb-0.5`}>{s.label}</p>
                    <p className={`${mono.className} text-xl font-bold ${s.color}`}>{String(s.value).padStart(2, '0')}</p>
                  </div>
                ))}
              </div>
            )}
            <a href="/admin" className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441] border border-[#232931] hover:border-[#D9A441]/50 px-4 py-2 rounded-lg transition-all`}>← Retour</a>
          </div>
        </header>

        {!isGenerated ? (
          <div className="bg-[#11151A] border border-[#232931] p-10 md:p-16 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E0524F] via-[#E0524F]/40 to-transparent" />
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full bg-[#1A1E23] border border-[#2A3038] flex items-center justify-center text-5xl">🥷</div>
              <Reticle color="#E0524F" size={14} />
            </div>
            <h2 className={`${display.className} text-3xl text-[#F2EFE9] mb-2 uppercase tracking-wider`}>{candidates.filter(c => c.status === 'qualified').length} Combattants Qualifiés</h2>
            <p className={`${mono.className} text-[#6B7178] text-sm mb-10 max-w-md mx-auto leading-relaxed`}>L'algorithme va créer des paires aléatoires et repasser les candidats au combat. Leurs téléphones s'actualiseront.</p>
            <button onClick={generateDuels} className={`${display.className} bg-[#E0524F] hover:bg-[#C4403D] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-lg transition-all hover:scale-105`}>
              Générer le Tableau
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {duels.map((duel, index) => {
              const resolved = duel.status === 'completed';
              const allPending = !resolved;

              if (!duel.fighter2) {
                // Solo card
                return (
                  <div key={duel.id} className={`bg-[#11151A] border rounded-2xl overflow-hidden transition-all duration-500 ${resolved ? 'border-[#232931] opacity-80' : 'border-[#232931] hover:border-[#D9A441]/30'}`}>
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1A1E23]">
                      <p className={`${mono.className} text-[#6B7178] text-[10px] font-bold tracking-[0.25em] uppercase`}>Candidat Isolé</p>
                      {resolved ? (
                        <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#5FA876]/10 text-[#5FA876] border-[#5FA876]/30`}>Résolu</span>
                      ) : (
                        <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#D9A441]/10 text-[#D9A441] border-[#D9A441]/30`}>En attente d'épreuve spéciale</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 p-6 relative">
                      <FighterCard
                        fighter={duel.fighter1!}
                        state={resolved ? (duel.winner_id === duel.player1_id ? 'winner' : 'loser') : 'pending'}
                        onClick={() => {}}
                        disabled={true}
                        mono={mono.className} display={display.className}
                      />
                      {!resolved && (
                        <div className="flex flex-col gap-2 p-4 border border-[#232931] rounded-xl bg-[#0E1115]">
                           <button onClick={() => declareWinner(duel.id, duel.player1_id)} className={`${display.className} bg-[#5FA876]/10 text-[#5FA876] border border-[#5FA876]/30 hover:bg-[#5FA876] hover:text-[#0B0E11] px-6 py-2 rounded-lg uppercase tracking-wider`}>Valider</button>
                           <button onClick={() => declareLoserSolo(duel.id, duel.player1_id)} className={`${display.className} bg-[#E0524F]/10 text-[#E0524F] border border-[#E0524F]/30 hover:bg-[#E0524F] hover:text-[#0B0E11] px-6 py-2 rounded-lg uppercase tracking-wider`}>Éliminer</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={duel.id} className={`bg-[#11151A] border rounded-2xl overflow-hidden transition-all duration-500 ${resolved ? 'border-[#232931] opacity-80' : 'border-[#232931] hover:border-[#E0524F]/30'}`}>
                  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1A1E23]">
                    <p className={`${mono.className} text-[#6B7178] text-[10px] font-bold tracking-[0.25em] uppercase`}>Match {String(index + 1).padStart(2, '0')}</p>
                    {resolved ? (
                      <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#5FA876]/10 text-[#5FA876] border-[#5FA876]/30`}>Résolu</span>
                    ) : (
                      <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded bg-[#E0524F]/10 text-[#E0524F] border-[#E0524F]/30`}>En attente</span>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row items-stretch gap-0 relative">
                    <FighterCard
                      fighter={duel.fighter1!}
                      state={resolved ? (duel.winner_id === duel.player1_id ? 'winner' : 'loser') : 'pending'}
                      onClick={() => allPending && declareWinner(duel.id, duel.player1_id, duel.player2_id)}
                      disabled={resolved} mono={mono.className} display={display.className}
                    />
                    <div className="flex items-center justify-center px-4 py-6 md:py-0 flex-shrink-0 z-10">
                      <div className="relative">
                        <div className={`${display.className} text-4xl font-black italic select-none ${resolved ? 'text-[#2A3038]' : 'text-[#E0524F]'}`}>VS</div>
                      </div>
                    </div>
                    <FighterCard
                      fighter={duel.fighter2!}
                      state={resolved ? (duel.winner_id === duel.player2_id ? 'winner' : 'loser') : 'pending'}
                      onClick={() => allPending && declareWinner(duel.id, duel.player2_id!, duel.player1_id)}
                      disabled={resolved} mono={mono.className} display={display.className} reverse
                    />
                  </div>
                </div>
              );
            })}
            
            {stats.pending === 0 && stats.total > 0 && (
              <div className="pt-4 text-center">
                <button onClick={generateDuels} className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441] border border-[#232931] hover:border-[#D9A441]/50 px-6 py-3 rounded-lg transition-all uppercase tracking-widest`}>
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

type FighterState = 'pending' | 'winner' | 'loser';
function FighterCard({ fighter, state, onClick, disabled, mono, display, reverse = false }: any) {
  const containerCls = {
    pending: 'bg-[#0E1115] border-[#232931] hover:border-[#D9A441]/50 hover:bg-[#13171C] cursor-pointer group',
    winner:  'bg-[#5FA876]/10 border-[#5FA876]/60 shadow-[0_0_20px_rgba(95,168,118,0.15)] cursor-default',
    loser:   'bg-[#1A0E0E] border-[#E0524F]/20 opacity-50 grayscale cursor-default',
  }[state as FighterState];
  const reticleColor = state === 'winner' ? '#5FA876' : '#D9A441';

  return (
    <button onClick={onClick} disabled={disabled} className={`flex-1 border rounded-xl m-3 md:m-4 p-4 transition-all duration-300 ${containerCls}`}>
      <div className={`flex items-center gap-4 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-full h-full rounded-md bg-[#1A1E23] border border-[#232931] overflow-hidden">
            <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover" />
          </div>
          {(state === 'winner' || state === 'pending') && <Reticle color={reticleColor} size={10} />}
          {state === 'winner' && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#5FA876] border-2 border-[#11151A] flex items-center justify-center text-[9px]">✓</div>}
        </div>
        <div className={`flex-1 min-w-0 ${reverse ? 'text-right' : 'text-left'}`}>
          <p className={`${mono} text-[#D9A441] text-[10px] tracking-wider`}>#{fighter.id}</p>
          <p className={`${display} text-[#F2EFE9] text-xl uppercase leading-tight truncate`}>{fighter.name}</p>
          {state === 'pending' && <p className={`${mono} text-[10px] text-[#4A5057] group-hover:text-[#D9A441] transition-colors mt-1 uppercase tracking-wider`}>→ Déclarer vainqueur</p>}
          {state === 'winner' && <p className={`${mono} text-[10px] text-[#5FA876] mt-1 uppercase tracking-wider`}>Vainqueur</p>}
          {state === 'loser' && <p className={`${mono} text-[10px] text-[#E0524F] mt-1 uppercase tracking-wider`}>Éliminé</p>}
        </div>
      </div>
    </button>
  );
}
