'use client';

import { useState, useEffect, useMemo } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

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

function Backdrop({ tint }: { tint?: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      {tint && <div className="pointer-events-none fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse at center, ${tint}, transparent 65%)` }} />}
    </>
  );
}

function RatingForm({ sub, onDecision }: { sub: any; onDecision: (id: string, candidateId: string, d: 'qualified' | 'eliminated', score: number) => void }) {
  const [gout, setGout] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const moyenne = ((gout + presentation) / 2);
  const isGood = moyenne >= 6;

  return (
    <div className="space-y-5">
      <div>
        <div className={`${mono.className} flex justify-between text-xs mb-2`}>
          <span className="text-[#9AA0A6] uppercase tracking-widest">Goût & Cuisson</span>
          <span className={gout >= 6 ? 'text-[#5FA876]' : 'text-[#D9A441]'}>{gout} / 10</span>
        </div>
        <input type="range" min="0" max="10" value={gout} onChange={e => setGout(Number(e.target.value))} className="w-full accent-[#D9A441]" />
      </div>

      <div>
        <div className={`${mono.className} flex justify-between text-xs mb-2`}>
          <span className="text-[#9AA0A6] uppercase tracking-widest">Présentation</span>
          <span className={presentation >= 6 ? 'text-[#5FA876]' : 'text-[#D9A441]'}>{presentation} / 10</span>
        </div>
        <input type="range" min="0" max="10" value={presentation} onChange={e => setPresentation(Number(e.target.value))} className="w-full accent-[#D9A441]" />
      </div>

      <div className={`flex items-center justify-between px-4 py-2 rounded-lg border ${isGood ? 'bg-[#5FA876]/10 border-[#5FA876]/30' : 'bg-[#D9A441]/10 border-[#D9A441]/20'}`}>
        <p className={`${mono.className} text-[10px] uppercase tracking-widest ${isGood ? 'text-[#5FA876]' : 'text-[#D9A441]'}`}>Moyenne jury</p>
        <p className={`${mono.className} font-bold text-xl ${isGood ? 'text-[#5FA876]' : 'text-[#D9A441]'}`}>{moyenne.toFixed(1)}</p>
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#1C2028]">
        <button onClick={() => onDecision(sub.id, sub.candidate_id, 'eliminated', moyenne)} className={`${display.className} flex-1 py-2.5 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}>
          ✕ Éliminer
        </button>
        <button onClick={() => onDecision(sub.id, sub.candidate_id, 'qualified', moyenne)} className={`${display.className} flex-1 py-2.5 bg-[#3FAEC4]/10 text-[#3FAEC4] border border-[#3FAEC4]/30 rounded-lg hover:bg-[#3FAEC4] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}>
          ✓ Qualifier
        </button>
      </div>
    </div>
  );
}

export default function CulinaryJuryPanel() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  const fetchState = async () => {
    const { data: dData } = await supabase.from('cuisine_dishes').select('*').order('created_at', { ascending: false });
    const { data: cData } = await supabase.from('candidates').select('*');
    
    if (cData) setCandidates(cData);
    
    if (dData && cData) {
      const mapped = dData.map(d => ({
        ...d,
        candidate: cData.find(c => c.id === d.candidate_id)
      })).filter(d => d.candidate);
      
      // Keep only the latest pending dish for a candidate if there are multiple pending
      const latestPending = new Map();
      mapped.forEach(d => {
        if (d.status === 'pending') {
          if (!latestPending.has(d.candidate_id)) {
            latestPending.set(d.candidate_id, d.id);
          }
        }
      });
      
      const filtered = mapped.filter(d => d.status !== 'pending' || latestPending.get(d.candidate_id) === d.id);
      
      setSubmissions(filtered);
    } else {
      setSubmissions([]);
    }
  };

  useEffect(() => {
    fetchState();
    const channel = supabase.channel('cuisine_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cuisine_dishes' }, fetchState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchState)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDecision = async (id: string, candidateId: string, decision: 'qualified' | 'eliminated', score: number) => {
    if (!window.confirm(`Confirmer la décision : ${decision.toUpperCase()} ?`)) return;
    await supabase.from('cuisine_scores').insert({ dish_id: id, judge_name: 'GM', score: Math.round(score * 10) }); // store score * 10 to keep precision
    await supabase.from('cuisine_dishes').update({ status: decision }).eq('id', id);
    await supabase.from('candidates').update({ status: decision }).eq('id', candidateId);
    fetchState();
  };

  const startStep = async () => {
    if (!window.confirm("Démarrer l'épreuve ? (Cela va réinitialiser les anciens plats/notes et repasser tous les candidats en lice)")) return;
    
    // Reset Data
    await supabase.from('cuisine_scores').delete().not('id', 'is', null);
    await supabase.from('cuisine_dishes').delete().not('id', 'is', null);

    const qualified = candidates.filter(c => c.status !== 'eliminated');
    for (const c of qualified) {
      await supabase.from('candidates').update({ status: 'active' }).eq('id', c.id);
    }
    fetchState();
  };

  const pending    = submissions.filter(s => s.status === 'pending').length;
  const qualified  = submissions.filter(s => s.status === 'qualified').length;
  const eliminated = submissions.filter(s => s.status === 'eliminated').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(63,174,196,0.05)" />

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">

        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-10 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#3FAEC4] via-[#3FAEC4]/40 to-transparent" />
          <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className={`${mono.className} text-[#3FAEC4] text-[10px] uppercase tracking-[0.25em] mb-1`}>
                ÉCRAN GM // ÉTAPE III
              </p>
              <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] uppercase tracking-wider`}>
                Jury <span className="text-[#3FAEC4]">Culinaire</span>
              </h1>
              <p className={`${mono.className} text-[#6B7178] text-xs mt-2`}>
                Évaluez les plats soumis et décidez du sort des candidats.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative bg-[#0B0E11] border border-[#D9A441]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <Reticle color="#D9A441" size={8} />
                <p className={`${mono.className} text-[#D9A441] text-xl font-bold`}>{pending}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>En cours</p>
              </div>
              <div className="bg-[#0B0E11] border border-[#3FAEC4]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <p className={`${mono.className} text-[#3FAEC4] text-xl font-bold`}>{qualified}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>Qualifiés</p>
              </div>
              <div className="bg-[#0B0E11] border border-[#E0524F]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <p className={`${mono.className} text-[#E0524F] text-xl font-bold`}>{eliminated}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>Éliminés</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0E1115] border-t border-[#232931] px-6 py-4 flex justify-between items-center">
            <button onClick={startStep} className={`${mono.className} text-[10px] uppercase tracking-widest bg-[#D9A441]/10 text-[#D9A441] px-4 py-2 rounded border border-[#D9A441]/30 hover:bg-[#D9A441] hover:text-[#0B0E11] transition-colors`}>
              ► Démarrer l'épreuve (Remettre les qualifiés en lice)
            </button>
            <a href="/admin" className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#3FAEC4]`}>
              ← Retour au Radar
            </a>
          </div>
        </header>

        {submissions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#232931] rounded-2xl">
            <span className="text-4xl mb-4 block">🍽️</span>
            <p className={`${mono.className} text-[#6B7178] uppercase tracking-widest text-sm`}>Aucun plat soumis pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => {
              const isQualified  = sub.status === 'qualified';
              const isEliminated = sub.status === 'eliminated';
              const isPending    = sub.status === 'pending';

              const accentColor = isQualified ? '#3FAEC4' : isEliminated ? '#E0524F' : '#D9A441';

              return (
                <div key={sub.id} className={`relative bg-[#11151A] border rounded-2xl overflow-hidden transition-all ${
                    isQualified  ? 'border-[#3FAEC4]/40 shadow-[0_0_25px_rgba(63,174,196,0.08)]' :
                    isEliminated ? 'border-[#E0524F]/20 opacity-55 grayscale' :
                    'border-[#232931] hover:border-[#D9A441]/30'
                  }`}
                >
                  <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55, transparent)` }} />

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-6 pb-4 border-b border-[#1C2028]">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className={`w-full h-full rounded-xl bg-[#1A1E23] overflow-hidden border ${isEliminated ? 'border-[#E0524F]/30' : isQualified ? 'border-[#3FAEC4]/40' : 'border-[#232931]'}`}>
                          <img src={sub.candidate.photo_url} alt={sub.candidate.name} className={`w-full h-full object-cover ${isEliminated ? 'grayscale' : ''}`} />
                        </div>
                        {isPending && <Reticle color="#D9A441" size={10} />}
                        {isQualified && (
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#3FAEC4] border-[3px] border-[#11151A] flex items-center justify-center text-[10px] text-white">✓</div>
                        )}
                        {isEliminated && (
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#E0524F] border-[3px] border-[#11151A] flex items-center justify-center text-[10px] text-white">✕</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`${mono.className} text-[#D9A441] text-[10px] tracking-wider`}>#{sub.candidate.id}</p>
                          <span className={`${mono.className} text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${
                            isQualified ? 'bg-[#3FAEC4]/10 text-[#3FAEC4] border-[#3FAEC4]/30' :
                            isEliminated ? 'bg-[#E0524F]/10 text-[#E0524F] border-[#E0524F]/30' :
                            'bg-[#D9A441]/10 text-[#D9A441] border-[#D9A441]/30 animate-pulse'
                          }`}>
                            {isQualified ? 'Admis' : isEliminated ? 'Échoué' : 'À déguster'}
                          </span>
                        </div>
                        <h2 className={`${display.className} text-[#F2EFE9] text-xl uppercase leading-tight truncate`}>{sub.candidate.name}</h2>
                        <div className="mt-2 bg-[#0B0E11] px-3 py-2 rounded border border-[#232931]">
                          <p className={`${mono.className} text-[#4A5057] text-[9px] uppercase tracking-widest mb-0.5`}>Plat proposé</p>
                          <p className={`${display.className} text-lg text-[#E8E6E1] leading-tight`}>« {sub.dish_name} »</p>
                        </div>
                      </div>
                    </div>

                    {isPending ? (
                      <RatingForm sub={sub} onDecision={handleDecision} />
                    ) : (
                      <div className="text-center py-4 bg-[#0B0E11] border border-[#1C2028] rounded-lg">
                        <p className={`${mono.className} text-xs uppercase tracking-widest ${isQualified ? 'text-[#3FAEC4]' : 'text-[#E0524F]'}`}>
                          {isQualified ? 'Qualifié pour la suite' : 'Fin de l\'aventure'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
