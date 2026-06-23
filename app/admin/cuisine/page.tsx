'use client';

import { useState } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Fausses données : Plats soumis par les candidats (Règle 7)
const MOCK_SUBMISSIONS = [
  { id: '405', name: 'Gon Freecss',    photo: 'https://i.pinimg.com/736x/87/a7/6c/87a76c66914562c5e5330de9910dd2b6.jpg', dishName: 'Porc rôti aux pommes',         status: 'pending' },
  { id: '404', name: 'Kurapika',       photo: 'https://i.pinimg.com/736x/60/0a/63/600a6311de1b453e00cfbe31d6833c84.jpg', dishName: 'Sushi de poisson des cavernes', status: 'pending' },
  { id: '99',  name: 'Killua Zoldyck', photo: 'https://i.pinimg.com/736x/a2/e8/cf/a2e8cfaeb63b3ea595d2c2b3e8e19c3d.jpg', dishName: 'Rien (Plat brûlé)',            status: 'pending' },
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

type Submission = (typeof MOCK_SUBMISSIONS)[0];

// ─── Notation par sliders avec scores contrôlés ───────────────────────────────
function RatingForm({ sub, onDecision }: { sub: Submission; onDecision: (id: string, d: 'qualified' | 'eliminated') => void }) {
  const [gout, setGout]       = useState(5);
  const [presentation, setPresentation] = useState(5);
  const moyenne = ((gout + presentation) / 2).toFixed(1);
  const isGood  = parseFloat(moyenne) >= 6;

  return (
    <div className="space-y-5">
      {/* Slider Goût */}
      <div>
        <div className={`${mono.className} flex justify-between text-xs mb-2`}>
          <span className="text-[#9AA0A6] uppercase tracking-widest">Goût & Cuisson</span>
          <span className={gout >= 6 ? 'text-[#5FA876]' : 'text-[#D9A441]'}>{gout} / 10</span>
        </div>
        <input
          type="range" min="0" max="10" value={gout}
          onChange={e => setGout(Number(e.target.value))}
          className="w-full accent-[#D9A441]"
        />
      </div>

      {/* Slider Présentation */}
      <div>
        <div className={`${mono.className} flex justify-between text-xs mb-2`}>
          <span className="text-[#9AA0A6] uppercase tracking-widest">Présentation</span>
          <span className={presentation >= 6 ? 'text-[#5FA876]' : 'text-[#D9A441]'}>{presentation} / 10</span>
        </div>
        <input
          type="range" min="0" max="10" value={presentation}
          onChange={e => setPresentation(Number(e.target.value))}
          className="w-full accent-[#D9A441]"
        />
      </div>

      {/* Moyenne */}
      <div className={`flex items-center justify-between px-4 py-2 rounded-lg border ${isGood ? 'bg-[#5FA876]/10 border-[#5FA876]/30' : 'bg-[#D9A441]/10 border-[#D9A441]/20'}`}>
        <p className={`${mono.className} text-[10px] uppercase tracking-widest ${isGood ? 'text-[#5FA876]' : 'text-[#D9A441]'}`}>
          Moyenne jury
        </p>
        <p className={`${mono.className} font-bold text-xl ${isGood ? 'text-[#5FA876]' : 'text-[#D9A441]'}`}>
          {moyenne}
        </p>
      </div>

      {/* Boutons de décision */}
      <div className="flex gap-3 pt-2 border-t border-[#1C2028]">
        <button
          onClick={() => onDecision(sub.id, 'eliminated')}
          className={`${display.className} flex-1 py-2.5 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
        >
          ✕ Éliminer
        </button>
        <button
          onClick={() => onDecision(sub.id, 'qualified')}
          className={`${display.className} flex-1 py-2.5 bg-[#3FAEC4]/10 text-[#3FAEC4] border border-[#3FAEC4]/30 rounded-lg hover:bg-[#3FAEC4] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
        >
          ✓ Qualifier
        </button>
      </div>
    </div>
  );
}

export default function CulinaryJuryPanel() {
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);

  const handleDecision = (id: string, decision: 'qualified' | 'eliminated') => {
    if (!window.confirm(`Confirmer la décision : ${decision.toUpperCase()} pour le candidat #${id} ?`)) return;
    setSubmissions(submissions.map(sub => sub.id === id ? { ...sub, status: decision } : sub));
  };

  const pending    = submissions.filter(s => s.status === 'pending').length;
  const qualified  = submissions.filter(s => s.status === 'qualified').length;
  const eliminated = submissions.filter(s => s.status === 'eliminated').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(63,174,196,0.05)" />

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
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

            {/* Compteurs de statut */}
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
        </header>

        {/* ── Grille des candidats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => {
            const isQualified  = sub.status === 'qualified';
            const isEliminated = sub.status === 'eliminated';
            const isPending    = sub.status === 'pending';

            const accentColor = isQualified ? '#3FAEC4' : isEliminated ? '#E0524F' : '#D9A441';

            return (
              <div
                key={sub.id}
                className={`relative bg-[#11151A] border rounded-2xl overflow-hidden transition-all ${
                  isQualified  ? 'border-[#3FAEC4]/40 shadow-[0_0_25px_rgba(63,174,196,0.08)]' :
                  isEliminated ? 'border-[#E0524F]/20 opacity-55 grayscale' :
                  'border-[#232931] hover:border-[#D9A441]/30'
                }`}
              >
                {/* Barre de couleur en haut */}
                <div
                  className="h-[2px] w-full"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55, transparent)` }}
                />

                <div className="p-6">
                  {/* ── Entête candidat ─────────────────────────────────────── */}
                  <div className="flex items-start gap-4 mb-6 pb-4 border-b border-[#1C2028]">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <div className={`w-full h-full rounded-xl bg-[#1A1E23] overflow-hidden border ${isEliminated ? 'border-[#E0524F]/30' : isQualified ? 'border-[#3FAEC4]/40' : 'border-[#232931]'}`}>
                        <img
                          src={sub.photo}
                          alt={sub.name}
                          className={`w-full h-full object-cover ${isEliminated ? 'grayscale' : ''}`}
                        />
                      </div>
                      <Reticle color={accentColor} size={8} />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <p className={`${mono.className} text-[10px] uppercase tracking-wider mb-0.5`} style={{ color: accentColor }}>
                        #{sub.id}
                      </p>
                      <h3 className={`${display.className} text-xl uppercase text-[#F2EFE9] truncate`}>
                        {sub.name}
                      </h3>
                      {/* Plat soumis */}
                      <div className="mt-2 bg-[#0B0E11] border border-[#232931] rounded-lg px-3 py-2">
                        <p className={`${mono.className} text-[#4A5057] text-[9px] uppercase tracking-widest mb-0.5`}>
                          Plat soumis
                        </p>
                        <p className="text-sm font-bold text-[#3FAEC4] italic">
                          &ldquo;{sub.dishName}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Corps : formulaire ou verdict ───────────────────────── */}
                  {isPending ? (
                    <RatingForm sub={sub} onDecision={handleDecision} />
                  ) : (
                    <div className="relative flex flex-col items-center justify-center py-6 gap-3">
                      {isQualified && <Reticle color="#3FAEC4" size={10} />}

                      <p
                        className={`${display.className} text-4xl font-bold uppercase tracking-widest`}
                        style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}66` }}
                      >
                        {isQualified ? 'Qualifié' : 'Éliminé'}
                      </p>

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border`} style={{ borderColor: `${accentColor}33`, background: `${accentColor}10` }}>
                        <span className="relative flex h-1.5 w-1.5">
                          {isQualified && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-60" />}
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: accentColor }} />
                        </span>
                        <p className={`${mono.className} text-[10px] uppercase tracking-widest`} style={{ color: accentColor }}>
                          {isQualified ? 'Dossier validé · Prochaine étape' : 'Dossier clôturé · Remettre le badge'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pied de page ───────────────────────────────────────────────────── */}
        <p className={`${mono.className} text-center text-[#2A3038] text-[9px] uppercase tracking-[0.2em] pt-8`}>
          HMS · Hunter Management System · v2.0
        </p>

      </div>
    </div>
  );
}