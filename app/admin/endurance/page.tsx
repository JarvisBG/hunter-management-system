'use client';

import { useState, useEffect } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

type Candidate = {
  id: string;
  name: string;
  photo_url: string;
  status: string;
};

type EggRequest = {
  id: string;
  candidateId: string;
  name: string;
  code: string;
};

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

// ─── Fond commun (scanline + vignette) ───────────────────────────────────────
function Backdrop({ tint }: { tint?: string }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] z-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }}
      />
      {tint && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: `radial-gradient(ellipse at center, ${tint}, transparent 65%)` }}
        />
      )}
    </>
  );
}

export default function EnduranceMonitor() {
  const [runners, setRunners]         = useState<Candidate[]>([]);
  const [eggRequests, setEggRequests] = useState<EggRequest[]>([]);

  const fetchData = async () => {
    // Récupération des candidats
    const { data: cData } = await supabase.from('candidates').select('*').order('created_at', { ascending: true });
    if (cData) setRunners(cData);

    // Récupération des oeufs non validés
    const { data: eData } = await supabase.from('eggs').select('id, code, claimed_by, candidates(name)').eq('is_claimed', false);
    if (eData) {
      setEggRequests(eData.map((e: any) => ({
        id: e.id,
        candidateId: e.claimed_by,
        name: e.candidates?.name || 'Inconnu',
        code: e.code
      })));
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('endurance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eggs' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleManualAction = async (id: string, action: 'qualified' | 'eliminated') => {
    const { error } = await supabase.from('candidates').update({ status: action }).eq('id', id);
    if (error) alert("Erreur: " + error.message);
    fetchData();
  };

  const handleEggValidation = async (reqId: string, isValid: boolean, candidateId: string) => {
    if (isValid) {
      await supabase.from('eggs').update({ is_claimed: true }).eq('id', reqId);
      await supabase.from('candidates').update({ status: 'qualified' }).eq('id', candidateId);
      alert(`Code Œuf validé ! Le candidat #${candidateId} est qualifié d'office.`);
    } else {
      await supabase.from('eggs').delete().eq('id', reqId);
    }
    fetchData();
  };

  const active    = runners.filter(r => r.status === 'active').length;
  const qualified = runners.filter(r => r.status === 'qualified').length;
  const eliminated = runners.filter(r => r.status === 'eliminated').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(95,168,118,0.05)" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-10 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#5FA876] via-[#5FA876]/40 to-transparent" />
          <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className={`${mono.className} text-[#5FA876] text-[10px] uppercase tracking-[0.25em] mb-1`}>
                ÉCRAN GM // ÉTAPE I
              </p>
              <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] uppercase tracking-wider`}>
                Course <span className="text-[#5FA876]">d&apos;Endurance</span>
              </h1>
              <p className={`${mono.className} text-[#6B7178] text-xs mt-2`}>
                Surveillez les arrivées, qualifiez les coureurs et validez les œufs cachés.
              </p>
            </div>

            {/* Compteurs de statut */}
            <div className="flex gap-3">
              <div className="relative bg-[#0B0E11] border border-[#5FA876]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <Reticle color="#5FA876" size={8} />
                <p className={`${mono.className} text-[#5FA876] text-xl font-bold`}>{active}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>En lice</p>
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
        </header>

        {/* ── Grille ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche : Codes Œufs ───────────────────────────────────── */}
          <div className="lg:col-span-1 h-fit bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(217,164,65,0.04)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
            <div className="p-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-6 flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A441]" />
                </span>
                Codes Œufs
              </h2>

              {eggRequests.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#232931] rounded-xl">
                  <p className={`${mono.className} text-[#2A3038] text-3xl mb-2`}>🥚</p>
                  <p className={`${mono.className} text-[#6B7178] text-xs uppercase tracking-widest`}>
                    Aucun code soumis
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eggRequests.map(req => (
                    <div key={req.id} className="relative bg-[#0B0E11] border border-[#D9A441]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(217,164,65,0.05)]">
                      <Reticle color="#D9A441" size={8} />

                      <p className={`${mono.className} text-[#D9A441] text-[10px] uppercase tracking-wider mb-1`}>
                        De : #{req.candidateId} · {req.name}
                      </p>
                      <p className={`${mono.className} text-[#F2EFE9] font-bold tracking-[0.2em] text-sm bg-[#1A1E23] border border-[#232931] p-2 rounded-lg text-center mt-2`}>
                        {req.code}
                      </p>

                      <div className="flex gap-2 mt-4 border-t border-[#1C2028] pt-3">
                        <button
                          onClick={() => handleEggValidation(req.id, false, req.candidateId)}
                          className={`${display.className} flex-1 py-2 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
                        >
                          ✕ Faux
                        </button>
                        <button
                          onClick={() => handleEggValidation(req.id, true, req.candidateId)}
                          className={`${display.className} flex-1 py-2 bg-[#5FA876]/10 text-[#5FA876] border border-[#5FA876]/30 rounded-lg hover:bg-[#5FA876] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
                        >
                          ✓ Valider
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Colonne droite : Radar des coureurs ──────────────────────────── */}
          <div className="lg:col-span-2 bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(63,174,196,0.04)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#3FAEC4] via-[#3FAEC4]/40 to-transparent" />
            <div className="p-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-6 flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FAEC4]" />
                </span>
                Radar de la Course
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {runners.map(runner => {
                  const isQualified  = runner.status === 'qualified';
                  const isEliminated = runner.status === 'eliminated';
                  const isActive     = runner.status === 'active';
                  const accentColor  = isQualified ? '#3FAEC4' : isEliminated ? '#E0524F' : '#5FA876';

                  return (
                    <div
                      key={runner.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isQualified  ? 'bg-[#3FAEC4]/10 border-[#3FAEC4]/40 shadow-[0_0_15px_rgba(63,174,196,0.06)]' :
                        isEliminated ? 'bg-[#1A0E0E] border-[#E0524F]/20 grayscale opacity-55' :
                        'bg-[#0B0E11] border-[#232931] hover:border-[#5FA876]/30'
                      }`}
                    >
                      {isActive && <Reticle color="#5FA876" size={8} />}
                      {isQualified && <Reticle color="#3FAEC4" size={8} />}

                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className={`w-full h-full rounded-xl overflow-hidden border ${
                          isQualified  ? 'border-[#3FAEC4]/50' :
                          isEliminated ? 'border-[#E0524F]/30' :
                          'border-[#232931]'
                        }`}>
                          <img src={runner.photo_url || ''} alt={runner.name} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 overflow-hidden">
                        <p className={`${mono.className} text-[10px] uppercase tracking-wider`} style={{ color: accentColor }}>
                          #{runner.id}
                        </p>
                        <h3 className={`${display.className} text-[#F2EFE9] uppercase truncate`}>
                          {runner.name}
                        </h3>
                        {/* Statut badge */}
                        {!isActive && (
                          <span
                            className={`${mono.className} inline-flex items-center gap-1 mt-1 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border`}
                            style={{ color: accentColor, borderColor: `${accentColor}44`, background: `${accentColor}12` }}
                          >
                            {isQualified ? (
                              <>
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-60" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3FAEC4]" />
                                </span>
                                Validé
                              </>
                            ) : 'Hors-jeu'}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {isActive && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleManualAction(runner.id, 'qualified')}
                            className={`${display.className} px-3 py-1.5 bg-[#3FAEC4]/10 text-[#3FAEC4] border border-[#3FAEC4]/30 rounded-lg hover:bg-[#3FAEC4] hover:text-[#0B0E11] text-[10px] uppercase tracking-wider transition-colors`}
                          >
                            ✓ Qualifié
                          </button>
                          <button
                            onClick={() => handleManualAction(runner.id, 'eliminated')}
                            className={`${display.className} px-3 py-1.5 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] text-[10px] uppercase tracking-wider transition-colors`}
                          >
                            ✕ Éliminé
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── Pied de page ───────────────────────────────────────────────────── */}
        <p className={`${mono.className} text-center text-[#2A3038] text-[9px] uppercase tracking-[0.2em] pt-8`}>
          HMS · Hunter Management System · v2.0
        </p>

      </div>
    </div>
  );
}