'use client';

import { useState, useEffect } from 'react';
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

export default function BadgeTracker() {
  const [requests, setRequests] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  const fetchState = async () => {
    // Candidates
    const { data: cData } = await supabase.from('candidates').select('*');
    if (cData) setCandidates(cData);

    // Pending Requests
    const { data: rData } = await supabase.from('badge_hunts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
      
    if (rData && cData) {
      setRequests(rData.map(r => ({
        ...r,
        candidate: cData.find(c => c.id === r.candidate_id)
      })).filter(r => r.candidate));
    } else {
      setRequests([]);
    }

    // Scores
    const { data: sData } = await supabase.from('badge_hunts')
      .select('*')
      .eq('status', 'approved');

    if (sData && cData) {
      const aggScores = cData.map(c => {
        const cScores = sData.filter(s => s.candidate_id === c.id);
        const total = cScores.reduce((acc, curr) => acc + curr.points, 0);
        return {
          id: c.id,
          name: c.name,
          score: total,
          status: c.status
        };
      });
      setScores(aggScores);
    } else if (cData) {
      setScores(cData.map(c => ({ id: c.id, name: c.name, score: 0, status: c.status })));
    }
  };

  useEffect(() => {
    fetchState();
    const channel = supabase.channel('badges_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'badge_hunts' }, fetchState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchState)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDecision = async (huntId: string, candidateId: string, decision: 'approved' | 'rejected', points: number = 0) => {
    // 1. Update hunt
    await supabase.from('badge_hunts').update({ status: decision, points }).eq('id', huntId);

    // 2. Check total points for candidate if approved
    if (decision === 'approved') {
      const { data: allHunts } = await supabase.from('badge_hunts').select('points').eq('candidate_id', candidateId).eq('status', 'approved');
      let total = 0;
      if (allHunts) {
        total = allHunts.reduce((acc, curr) => acc + curr.points, 0);
      }
      if (total >= 6) {
        await supabase.from('candidates').update({ status: 'qualified' }).eq('id', candidateId);
      }
    }
    fetchState();
  };

  const handleDisqualify = async (candidateId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir disqualifier ce candidat de l'épreuve ?")) return;
    await supabase.from('candidates').update({ status: 'eliminated' }).eq('id', candidateId);
    fetchState();
  };

  const startStep = async () => {
    if (!window.confirm("Démarrer l'épreuve ? Cela va remettre les qualifiés en lice et leur assigner une cible aléatoire !")) return;

    // 1. Get qualified and active candidates (exclude eliminated)
    const qualified = candidates.filter(c => c.status !== 'eliminated');
    if (qualified.length === 0) {
      alert("Aucun candidat n'est en lice pour participer !");
      return;
    }

    // 2. Shuffle array
    const shuffled = [...qualified].sort(() => 0.5 - Math.random());
    
    // 3. Clear existing targets and previous hunts (Reset to Zero)
    await supabase.from('badge_targets').delete().neq('candidate_id', '0');
    await supabase.from('badge_hunts').delete().neq('candidate_id', '0');

    // 4. Create cycle targets and update status
    for (let i = 0; i < shuffled.length; i++) {
      const candidate = shuffled[i];
      const target = shuffled[(i + 1) % shuffled.length]; // Circular assignment
      
      await supabase.from('badge_targets').insert({ candidate_id: candidate.id, target_id: target.id });
      await supabase.from('candidates').update({ status: 'active' }).eq('id', candidate.id);
    }
    
    fetchState();
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(217,164,65,0.06)" />

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">
        
        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-10 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
          <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className={`${mono.className} text-[#D9A441] text-[10px] uppercase tracking-[0.25em] mb-1`}>
                ÉCRAN GM // ÉTAPE IV
              </p>
              <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] uppercase tracking-wider`}>
                Traque des <span className="text-[#D9A441]">Badges</span>
              </h1>
              <p className={`${mono.className} text-[#6B7178] text-xs mt-2`}>
                Validez les codes secrets pour incrémenter les points · Objectif : 6 pts
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <div className="bg-[#0B0E11] border border-[#D9A441]/30 rounded-xl px-5 py-3 text-center shadow-[0_0_20px_rgba(217,164,65,0.07)]">
                <Reticle color="#D9A441" size={10} />
                <p className={`${mono.className} text-[#D9A441] text-3xl font-bold`}>{requests.length}</p>
                <p className={`${mono.className} text-[#6B7178] text-[9px] uppercase tracking-widest mt-0.5`}>
                  En attente
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#0E1115] border-t border-[#232931] px-6 py-4 flex justify-between items-center">
            <button onClick={startStep} className={`${mono.className} text-[10px] uppercase tracking-widest bg-[#D9A441]/10 text-[#D9A441] px-4 py-2 rounded border border-[#D9A441]/30 hover:bg-[#D9A441] hover:text-[#0B0E11] transition-colors`}>
              ► Démarrer l'épreuve (Remettre en lice & Assigner les cibles)
            </button>
            <a href="/admin" className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441]`}>
              ← Retour au Radar
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#232931] pb-3">
              <span className="text-[#D9A441] text-xl">📡</span>
              <h2 className={`${display.className} text-xl uppercase tracking-widest text-[#F2EFE9]`}>Flux des soumissions</h2>
            </div>

            {requests.length === 0 ? (
              <div className="bg-[#11151A] border border-dashed border-[#232931] rounded-2xl p-10 text-center">
                <p className={`${mono.className} text-[#6B7178] text-sm uppercase tracking-widest`}>Aucun code en attente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="relative bg-[#11151A] border border-[#D9A441]/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(217,164,65,0.05)]">
                    <div className="h-full w-1 absolute top-0 left-0 bg-[#D9A441]" />
                    <div className="p-5 flex flex-col sm:flex-row gap-5 items-center">
                      
                      <div className="flex-1 flex items-center gap-4 w-full">
                        <img src={req.candidate.photo_url} alt={req.candidate.name} className="w-14 h-14 rounded-lg object-cover border border-[#232931]" />
                        <div>
                          <p className={`${mono.className} text-[#D9A441] text-[10px] tracking-wider mb-0.5`}>BADGE #{req.candidate.id}</p>
                          <h3 className={`${display.className} text-lg text-[#F2EFE9] uppercase`}>{req.candidate.name}</h3>
                        </div>
                      </div>

                      <div className="bg-[#0B0E11] px-4 py-3 rounded-xl border border-[#232931] w-full sm:w-auto text-center flex-1">
                        <p className={`${mono.className} text-[#6B7178] text-[9px] uppercase tracking-widest mb-1`}>Code Soumis</p>
                        <p className={`${mono.className} text-[#E8E6E1] text-lg font-bold tracking-widest`}>{req.scanned_code}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex gap-2">
                          <button onClick={() => handleDecision(req.id, req.candidate.id, 'approved', 3)} className={`${display.className} bg-[#5FA876]/10 text-[#5FA876] border border-[#5FA876]/30 px-3 py-2 rounded-lg hover:bg-[#5FA876] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}>
                            +3 pts
                          </button>
                          <button onClick={() => handleDecision(req.id, req.candidate.id, 'approved', 1)} className={`${display.className} bg-[#3FAEC4]/10 text-[#3FAEC4] border border-[#3FAEC4]/30 px-3 py-2 rounded-lg hover:bg-[#3FAEC4] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}>
                            +1 pt
                          </button>
                        </div>
                        <button onClick={() => handleDecision(req.id, req.candidate.id, 'rejected', 0)} className={`${display.className} bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 px-4 py-2 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}>
                          Refuser
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#232931] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-[#3FAEC4] text-xl">🏆</span>
                <h2 className={`${display.className} text-xl uppercase tracking-widest text-[#F2EFE9]`}>Classement</h2>
              </div>
              <span className={`${mono.className} text-[#6B7178] text-[10px]`}>Obj: 6 pts</span>
            </div>

            <div className="bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden">
              {scores.sort((a, b) => b.score - a.score).map((s, idx) => {
                const isQualified = s.status === 'qualified';
                const pct = Math.min(100, Math.round((s.score / 6) * 100));

                return (
                  <div key={s.id} className={`p-4 ${idx !== 0 ? 'border-t border-[#1C2028]' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`${mono.className} text-[10px] text-[#6B7178]`}>#{s.id}</span>
                        <h4 className={`${display.className} text-sm uppercase ${isQualified ? 'text-[#D9A441]' : 'text-[#E8E6E1]'}`}>
                          {s.name}
                        </h4>
                        {isQualified && <span className="text-[#D9A441] text-xs">⭐</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${mono.className} font-bold ${isQualified ? 'text-[#D9A441]' : 'text-[#3FAEC4]'}`}>
                          {s.score} <span className="text-[#6B7178] font-normal text-xs">pts</span>
                        </span>
                        {!isQualified && s.status !== 'eliminated' && (
                          <button onClick={() => handleDisqualify(s.id)} className={`${mono.className} text-[8px] bg-[#E0524F]/10 text-[#E0524F] hover:bg-[#E0524F] hover:text-[#0B0E11] px-2 py-1 rounded transition-colors uppercase tracking-widest ml-2`}>
                            Disqualifier
                          </button>
                        )}
                        {s.status === 'eliminated' && (
                          <span className={`${mono.className} text-[8px] text-[#E0524F] uppercase tracking-widest ml-2`}>
                            Disqualifié
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-[#0B0E11] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isQualified ? 'bg-[#D9A441]' : 'bg-[#3FAEC4]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
