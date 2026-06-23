'use client';

import { useState } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Fausses données : Soumissions de codes (Règle 8)
const INCOMING_CODES = [
  { id: '1', candidateId: '405', name: 'Gon Freecss', code: 'BADGE-99-ZOLDYCK', pointsClaimed: 3 },
  { id: '2', candidateId: '44', name: 'Hisoka Morow', code: 'BADGE-384-GERETTA', pointsClaimed: 1 },
];

const INITIAL_SCORES = [
  { id: '405', name: 'Gon Freecss', score: 3 },
  { id: '44', name: 'Hisoka Morow', score: 5 },
  { id: '99', name: 'Killua Zoldyck', score: 6 }, // Déjà qualifié
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

export default function BadgeTracker() {
  const [requests, setRequests] = useState(INCOMING_CODES);
  const [scores, setScores] = useState(INITIAL_SCORES);

  const handleCodeValidation = (requestId: string, isValid: boolean) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    if (isValid) {
      setScores(scores.map(s =>
        s.id === request.candidateId ? { ...s, score: s.score + request.pointsClaimed } : s
      ));
    }
    setRequests(requests.filter(r => r.id !== requestId));
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(217,164,65,0.06)" />

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            {/* Compteur live */}
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
        </header>

        {/* ── Grille 2 colonnes ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Colonne 1 : Flux des validations ────────────────────────────── */}
          <div className="bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(217,164,65,0.04)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#E0524F] via-[#E0524F]/40 to-transparent" />
            <div className="p-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-6 flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E0524F]" />
                </span>
                Codes en attente
              </h2>

              {requests.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#232931] rounded-xl">
                  <p className={`${mono.className} text-[#2A3038] text-4xl mb-3`}>✓</p>
                  <p className={`${mono.className} text-[#6B7178] text-xs uppercase tracking-widest`}>
                    File d'attente vide
                  </p>
                  <p className={`${mono.className} text-[#3A4048] text-[10px] mt-1`}>
                    Tous les codes ont été traités
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="relative bg-[#0B0E11] border border-[#232931] hover:border-[#D9A441]/30 p-4 rounded-xl transition-colors"
                    >
                      <Reticle color="#D9A441" size={8} />

                      {/* Infos candidat */}
                      <div className="mb-4">
                        <p className={`${mono.className} text-[#D9A441] text-[10px] uppercase tracking-wider mb-1`}>
                          De : #{req.candidateId} · {req.name}
                        </p>
                        <p className={`${mono.className} text-[#F2EFE9] font-bold tracking-[0.2em] text-sm`}>
                          {req.code}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-[#3FAEC4]/10 border border-[#3FAEC4]/20 rounded px-2 py-1">
                          <span className={`${mono.className} text-[#3FAEC4] text-[10px] uppercase tracking-widest`}>
                            Valeur réclamée :
                          </span>
                          <span className={`${mono.className} text-[#3FAEC4] font-bold text-xs`}>
                            +{req.pointsClaimed} pts
                          </span>
                        </div>
                      </div>

                      {/* Boutons */}
                      <div className="flex gap-2 border-t border-[#1C2028] pt-3">
                        <button
                          onClick={() => handleCodeValidation(req.id, false)}
                          className={`${display.className} flex-1 py-2 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
                        >
                          ✕ Faux
                        </button>
                        <button
                          onClick={() => handleCodeValidation(req.id, true)}
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

          {/* ── Colonne 2 : Classement / Points ─────────────────────────────── */}
          <div className="bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(217,164,65,0.04)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
            <div className="p-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-6 flex items-center gap-2`}>
                <span className="text-[#D9A441] font-black">#</span> Compteur de Points
              </h2>

              <div className="space-y-3">
                {[...scores].sort((a, b) => b.score - a.score).map((cand, idx) => {
                  const isQualified = cand.score >= 6;
                  const pct = Math.min((cand.score / 6) * 100, 100);

                  return (
                    <div
                      key={cand.id}
                      className={`relative bg-[#0B0E11] border rounded-xl p-4 transition-all ${
                        isQualified
                          ? 'border-[#3FAEC4]/40 shadow-[0_0_15px_rgba(63,174,196,0.08)]'
                          : 'border-[#232931]'
                      }`}
                    >
                      {isQualified && <Reticle color="#3FAEC4" size={8} />}

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Rang */}
                          <span className={`${mono.className} text-[#2A3038] font-bold text-3xl select-none leading-none`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className={`${display.className} text-base uppercase ${isQualified ? 'text-[#3FAEC4]' : 'text-[#F2EFE9]'}`}>
                              {cand.name}
                            </p>
                            <p className={`${mono.className} text-[#6B7178] text-[10px]`}>
                              Badge #{cand.id}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`${mono.className} text-2xl font-black leading-none ${isQualified ? 'text-[#3FAEC4]' : 'text-[#D9A441]'}`}>
                            {cand.score}
                            <span className={`${mono.className} text-sm text-[#4A5057]`}>/6</span>
                          </p>
                          {isQualified && (
                            <span className={`${mono.className} inline-flex items-center gap-1 mt-1 text-[8px] text-[#3FAEC4] uppercase tracking-widest`}>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3FAEC4]" />
                              </span>
                              Qualifié
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="h-[3px] w-full bg-[#1C2028] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: isQualified
                              ? 'linear-gradient(90deg, #3FAEC4, #3FAEC4aa)'
                              : 'linear-gradient(90deg, #D9A441, #D9A44166)',
                          }}
                        />
                      </div>
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