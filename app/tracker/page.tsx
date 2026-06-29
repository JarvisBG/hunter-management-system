'use client';

import { useMemo, useState, useEffect } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// --- DICTIONNAIRE DES ÉTAPES ---
const STEPS_DATA: Record<number, any> = {
  0: { title: "EN ATTENTE", location: "Lobby", description: "L'épreuve est actuellement en pause. Veuillez patienter.", icon: "⏸️" },
  1: { title: "COURSE D'ENDURANCE", location: "Zone devinée", description: "Les participants doivent courir sur un parcours défini. Seuls les premiers arrivés se qualifient pour l'étape suivante.", icon: "🥚" },
  2: { title: "DUEL DE BANDEAUX (RATTRAPAGE)", location: "Montagne de la Mort", description: "Dans un cercle défini, récupérez le bandeau de votre binôme ou poussez-le hors de la zone.", icon: "💪🏽" },
  3: { title: "JURY CULINAIRE", location: "Zone Gastronomique", description: "Les candidats doivent cuisiner un plat imposé sous pression. Le jury notera le goût, la présentation et l'organisation.", icon: "🍳" },
  4: { title: "CHASSE AUX BADGES", location: "Forêt de Zevil", description: "Chaque candidat doit traquer sa cible tout en protégeant son propre badge.", icon: "🎯" },
  5: { title: "BRIGADE FANTÔME", location: "Bataille Royale", description: "Dernière épreuve. Éliminez les cibles. Survivez. Ne laissez personne s'échapper.", icon: "🔫" },
};

// ─── Coin de visée ───────────────────────────────
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

// ─── Fond scanline + vignette ───────────────────
function Backdrop({ tint }: { tint?: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      {tint && (
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse at top, ${tint}, transparent 55%)` }} />
      )}
    </>
  );
}

export default function HunterTrackerPublic() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [activeStepId, setActiveStepId] = useState<number>(0);
  const [timeline, setTimeline] = useState<any[]>([]);

  const fetchAllData = async () => {
    // 1. Fetch Candidates
    const { data: cData } = await supabase.from('candidates').select('*').order('id', { ascending: true });
    if (cData) setCandidates(cData);

    // 2. Fetch Config
    const { data: gData } = await supabase.from('global_config').select('active_step_id').eq('id', 1).single();
    if (gData) setActiveStepId(gData.active_step_id);

    // 3. Fetch Timeline
    const { data: tData } = await supabase.from('timeline_events').select('*').order('created_at', { ascending: false }).limit(10);
    if (tData) setTimeline(tData);
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase.channel('public_tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_config' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events' }, fetchAllData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const total = candidates.length;
    if (total === 0) return { total: 0, survivors: 0, survivalRate: 0 };
    const eliminated = candidates.filter(c => c.status === 'eliminated').length;
    const survivors = total - eliminated;
    const survivalRate = Math.round((survivors / total) * 100);
    return { total, survivors, survivalRate };
  }, [candidates]);

  const activeStep = STEPS_DATA[activeStepId] || STEPS_DATA[0];

  const totalInscrits = Array.isArray(candidates) ? candidates.length : 0;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-20">
      <Backdrop tint="rgba(217,164,65,0.06)" />

      <div className="relative z-10 max-w-[1500px] mx-auto p-4 md:p-8">

        {/* ── EN-TÊTE ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b border-[#232931] pb-6">

          {/* Titre */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#E0524F]/10 border border-[#E0524F]/30 px-3 py-1 rounded-full mb-3 shadow-[0_0_10px_rgba(224,82,79,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E0524F]" />
              </span>
              <span className={`${mono.className} text-[#E0524F] text-[10px] font-bold uppercase tracking-widest`}>
                Diffusion en direct
              </span>
            </div>
            <h1 className={`${display.className} text-4xl md:text-6xl font-black text-[#F2EFE9] tracking-wider uppercase drop-shadow-lg`}>
              Hunter <span className="text-[#D9A441]">Tracker</span>
            </h1>
            <p className={`${mono.className} text-[#6B7178] text-xs mt-2 uppercase tracking-[0.2em]`}>
              Kmer Otaku Exam // Réseau Public
            </p>
          </div>

          {/* Compteur circulaire + stats */}
          <div className="flex items-center gap-6 bg-[#11151A] border border-[#232931] p-4 rounded-2xl shadow-2xl">
            {/* Jauge SVG */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#232931]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#D9A441] transition-all duration-1000 ease-out drop-shadow-[0_0_5px_rgba(217,164,65,0.5)]"
                  strokeWidth="3"
                  strokeDasharray={`${stats.survivalRate}, 100`}
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`${display.className} text-2xl font-bold text-[#F2EFE9]`}>
                  {stats.survivalRate}%
                </span>
              </div>
            </div>
            <div>
              <p className={`${mono.className} text-[#6B7178] text-[10px] uppercase tracking-widest mb-1`}>
                Survivants
              </p>
              <p className={`${display.className} text-4xl font-bold text-[#D9A441]`}>
                {stats.survivors}{' '}
                <span className="text-xl text-[#4A5057]">/ {stats.total}</span>
              </p>
            </div>
          </div>
        </header>

        {/* ── CORPS PRINCIPAL ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ─── COLONNE GAUCHE ─────────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">

            {/* ÉPREUVE EN COURS */}
            <div className="bg-gradient-to-b from-[#1A1813] to-[#11151A] border border-[#D9A441]/40 shadow-[0_0_20px_rgba(217,164,65,0.1)] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D9A441] to-transparent animate-pulse" />

              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A441]" />
                </span>
                <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-widest`}>
                  Épreuve en direct
                </span>
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className={`${mono.className} text-[#6B7178] text-[10px] uppercase tracking-widest mb-1`}>
                    Étape {String(activeStepId).padStart(2, '0')}
                  </p>
                  <h3 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase leading-tight`}>
                    {activeStep.title}
                  </h3>
                </div>
                <div className="text-3xl bg-[#0B0E11] p-2 rounded-lg border border-[#232931]">
                  {activeStep.icon}
                </div>
              </div>

              <p className={`${mono.className} text-[#D9A441]/70 text-[10px] uppercase tracking-widest mt-3 mb-2 flex items-center gap-1.5`}>
                <span className="text-[#D9A441]">📍</span> {activeStep.location}
              </p>

              <div className="bg-[#0B0E11] border border-[#232931] rounded-lg p-3">
                <p className="text-xs text-[#C5C2BB] leading-relaxed">
                  {activeStep.description}
                </p>
              </div>
            </div>

            {/* JOURNAL DE BORD (Timeline) */}
            <div className="bg-[#11151A] border border-[#232931] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#D9A441]/60 to-transparent" />
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-4 flex items-center gap-2`}>
                <span className="text-[#D9A441]">#</span> Journal de bord
              </h2>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className={`${mono.className} text-[#6B7178] text-xs text-center py-4`}>
                    Aucun événement récent.
                  </p>
                ) : (
                  timeline.map((event: any) => {
                    const timeString = new Date(event.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={event.id} className="flex gap-3 text-sm">
                        <span className={`${mono.className} text-[#6B7178] text-[11px] mt-0.5 whitespace-nowrap`}>
                          {timeString}
                        </span>
                        <div className="flex items-start gap-2 flex-1">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.type === 'danger' ? 'bg-[#E0524F] shadow-[0_0_6px_#E0524F]' :
                            event.type === 'success' ? 'bg-[#5FA876] shadow-[0_0_6px_#5FA876]' :
                              event.type === 'warning' ? 'bg-[#D9A441] shadow-[0_0_6px_#D9A441]' :
                                'bg-[#6B7178]'
                            }`} />
                          <p className={`text-xs ${event.type === 'danger' ? 'text-[#E0524F]' :
                            event.type === 'success' ? 'text-[#5FA876]' :
                              event.type === 'warning' ? 'text-[#D9A441]' : 'text-[#C5C2BB]'
                            }`}>
                            {event.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ENGAGEMENT SPECTATEUR */}
            <div className="bg-gradient-to-br from-[#1A1E23] to-[#11151A] border border-[#D9A441]/30 rounded-2xl p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#D9A441]/60 to-transparent" />
              <h3 className={`${display.className} text-[#D9A441] text-lg font-bold uppercase mb-2`}>
                Quiz Spectateur
              </h3>
              <p className="text-xs text-[#9AA0A6] mb-4 leading-relaxed">
                Répondez aux énigmes sur le live TikTok pour tenter de gagner des goodies exclusifs !
              </p>
              <button className={`${mono.className} w-full py-2.5 bg-[#D9A441] text-[#0B0E11] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#C2922F] transition-colors shadow-[0_0_15px_rgba(217,164,65,0.25)] hover:shadow-[0_0_25px_rgba(217,164,65,0.4)]`}>
                Rejoindre le Live
              </button>
            </div>
          </div>

          {/* ─── COLONNE DROITE : Trombinoscope ─────────────────────────── */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="flex justify-between items-end mb-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-2xl font-bold uppercase`}>
                Base de données <span className="text-[#D9A441]">Candidats</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className={`${mono.className} text-[10px] text-[#6B7178] uppercase tracking-widest`}>
                  {candidates.length} inscrits
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
              {candidates.map((candidate: any) => {
                const isEliminated = candidate.status === 'eliminated';
                const isQualified = candidate.status === 'qualified';

                return (
                  <div
                    key={candidate.id}
                    className={`relative group overflow-hidden rounded-xl border transition-all duration-300 ${isEliminated
                      ? 'border-[#E0524F]/30 bg-[#1A0E0E]'
                      : isQualified
                        ? 'border-[#3FAEC4]/50 bg-[#111A1C] hover:border-[#3FAEC4]/80 hover:shadow-[0_0_20px_rgba(63,174,196,0.15)]'
                        : 'border-[#232931] bg-[#11151A] hover:border-[#D9A441]/50 hover:shadow-[0_0_20px_rgba(217,164,65,0.1)]'
                      }`}
                  >
                    {/* Reticle sur les cartes actives/qualifiées */}
                    {!isEliminated && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        <Reticle color={isQualified ? '#3FAEC4' : '#D9A441'} size={10} />
                      </div>
                    )}

                    {/* Image candidat */}
                    <div className="aspect-[3/4] w-full overflow-hidden relative">
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isEliminated ? 'grayscale opacity-30' : ''
                          }`}
                      />

                      {/* X overlay si éliminé */}
                      {isEliminated && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-8xl md:text-9xl text-[#E0524F] opacity-60 font-black drop-shadow-[0_0_15px_rgba(224,82,79,1)] select-none">
                            X
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cartouche d'informations */}
                    <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-[#0B0E11] via-[#0B0E11]/95 to-transparent pt-10">
                      <div className="flex justify-between items-end">
                        <div className="overflow-hidden pr-2">
                          <h3 className={`${display.className} text-[#F2EFE9] text-sm md:text-lg font-bold uppercase truncate`}>
                            {candidate.name}
                          </h3>
                        </div>

                        {/* Point de statut */}
                        <div className="flex-shrink-0 mb-1">
                          {isEliminated ? (
                            <span className="block w-2.5 h-2.5 rounded-full bg-[#E0524F] shadow-[0_0_8px_#E0524F]" />
                          ) : isQualified ? (
                            <span className="block w-2.5 h-2.5 rounded-full bg-[#3FAEC4] shadow-[0_0_8px_#3FAEC4]" />
                          ) : (
                            <span className="block w-2.5 h-2.5 rounded-full bg-[#5FA876] animate-pulse shadow-[0_0_8px_#5FA876]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Légende statuts */}
            <div className="mt-8 flex flex-wrap gap-4 border-t border-[#232931] pt-5">
              {[
                { color: '#5FA876', shadow: '#5FA876', label: 'En lice', pulse: true },
                { color: '#3FAEC4', shadow: '#3FAEC4', label: 'Qualifié(e)', pulse: false },
                { color: '#E0524F', shadow: '#E0524F', label: 'Éliminé(e)', pulse: false },
              ].map(({ color, shadow, label, pulse }) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={`block w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`}
                    style={{ background: color, boxShadow: `0 0 6px ${shadow}` }}
                  />
                  <span className={`${mono.className} text-[#6B7178] text-[10px] uppercase tracking-widest`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}