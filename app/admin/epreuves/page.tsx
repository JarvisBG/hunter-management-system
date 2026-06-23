'use client';

import { useState, useEffect } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Définition statique des 5 épreuves basées sur le cahier des charges
const EXAM_STEPS = [
  {
    id: 1,
    title: "COURSE D'ENDURANCE",
    location: 'Parcours Vita - Yaoundé',
    description:
      "Les participants doivent courir sur un parcours défini. Seuls les premiers arrivés se qualifient pour l'étape suivante.",
    bonus: '10 œufs cachés dans le parcours qualifient d\'office ceux qui les trouvent.',
    icon: '🏃',
  },
  {
    id: 2,
    title: 'DUEL DE BANDEAUX (RATTRAPAGE)',
    location: 'Zone de Combat',
    description:
        'Dans un cercle défini, récupérez le bandeau de votre binôme ou poussez-le hors de la zone.',
    bonus: "Évalue l'intelligence tactique, l'observation et la force.",
    icon: '🥷',
  },
  {
    id: 3,
    title: "CUISINE : L'ART DE L'ADAPTATION",
    location: 'Zone Culinaire',
    description:
      'Cuisiner un plat imposé sous pression. Le jury (Morane, Falou, Ange) notera le goût, la présentation et l\'organisation.',
    bonus: "Pression temporelle et gestion de l'espace de travail.",
    icon: '🍳',
  },
  {
    id: 4,
    title: 'ATTAQUE AUX BADGES',
    location: 'Zone de Traque',
    description:
      "Chaque badge a une valeur précise. L'objectif est d'atteindre un total de 6 points pour valider l'examen.",
    bonus: 'Système de points stratégique.',
    icon: '📛',
  },
  {
    id: 5,
    title: 'PAINTBALL TACTIQUE',
    location: 'Zone de Tir (Brigade Fantôme)',
    description:
      'La confrontation finale pour révéler les meilleurs tacticiens. Survie de l\'équipe face à la Brigade Fantôme.',
    bonus: 'Coordination et réflexes sont essentiels.',
    icon: '🔫',
  },
  {
    id: 6,
    title: 'ÉNIGMES (TERMINAL)',
    location: 'En Ligne',
    description:
      "Épreuve asynchrone : les candidats ne verront que le terminal d'énigmes.",
    bonus: 'Réflexion rapide.',
    icon: '🧩',
  },
];

export default function StepsController() {
  const [activeStepId, setActiveStepId] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [timelineMsg, setTimelineMsg] = useState('');
  const [timelineType, setTimelineType] = useState('info');

  const fetchActiveStep = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_config')
      .select('active_step_id')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Erreur de récupération de la configuration :', error.message);
    } else if (data) {
      setActiveStepId(data.active_step_id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveStep();
  }, []);

  const activateStep = async (stepId: number) => {
    const msg = stepId === 0 
      ? "Es-tu sûr de vouloir désactiver l'épreuve en cours (mettre en Pause) pour tous les candidats ?"
      : `Es-tu sûr de vouloir activer l'Étape ${stepId} pour tous les candidats en lice ?`;

    const confirmation = window.confirm(msg);
    if (!confirmation) return;

    if (stepId > 0) {
      const wipe = window.confirm(`Veux-tu RÉINITIALISER complètement l'Étape ${stepId} (effacer toutes les données précédentes) ?\n\nClique sur [OK] pour tout effacer et repartir de zéro.\nClique sur [Annuler] pour simplement changer d'écran sans effacer les données.`);
      if (wipe) {
        if (stepId === 1) {
          await supabase.from('eggs').delete().not('id', 'is', null);
        } else if (stepId === 2) {
          await supabase.from('duels').delete().not('id', 'is', null);
        } else if (stepId === 3) {
          await supabase.from('cuisine_scores').delete().not('id', 'is', null);
          await supabase.from('cuisine_dishes').delete().not('id', 'is', null);
        } else if (stepId === 4) {
          await supabase.from('badge_targets').delete().not('candidate_id', 'is', null);
          await supabase.from('badge_hunts').delete().not('id', 'is', null);
        }
      }
    }

    const { error } = await supabase
      .from('global_config')
      .update({ active_step_id: stepId })
      .eq('id', 1);

    if (error) {
      alert('Erreur lors de la mise à jour : ' + error.message);
    } else {
      setActiveStepId(stepId);
    }
  };

  const publishTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineMsg.trim()) return;

    const { error } = await supabase.from('timeline_events').insert([{
      message: timelineMsg,
      type: timelineType
    }]);

    if (error) {
      alert("Erreur lors de l'envoi : " + error.message);
    } else {
      setTimelineMsg('');
      alert("Événement publié avec succès sur le Tracker !");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30">
      {/* Texture scanline ambiante */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(217,164,65,0.06), transparent 55%)',
        }}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#232931] pb-6 mb-10">
          <div>
            <p className={`${mono.className} text-[#D9A441]/70 text-xs tracking-[0.2em] mb-2`}>
              &gt; GESTION DES ÉPREUVES — TEMPS RÉEL_
            </p>
            <h1
              className={`${display.className} text-4xl md:text-5xl font-bold text-[#F2EFE9] tracking-wide uppercase`}
            >
              HMS <span className="text-[#D9A441]">// CONTROL PANEL</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`${mono.className} bg-[#11151A] border ${
                activeStepId === 0 ? 'border-[#E0524F]' : 'border-[#232931]'
              } rounded-lg px-4 py-2 text-xs uppercase tracking-widest ${
                activeStepId === 0 ? 'text-[#E0524F]' : 'text-[#9AA0A6]'
              }`}
            >
              {activeStepId === 0 ? (
                <span className="font-bold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E0524F]" />
                  </span>
                  EN PAUSE
                </span>
              ) : (
                <>
                  Étape{' '}
                  <span className="text-[#D9A441] font-bold">
                    {String(activeStepId).padStart(2, '0')}
                  </span>{' '}
                  / {String(EXAM_STEPS.length).padStart(2, '0')}
                </>
              )}
            </div>
            <a
              href="/admin"
              className={`${mono.className} text-sm text-[#9AA0A6] hover:text-[#D9A441] border border-[#232931] hover:border-[#D9A441]/50 px-4 py-2 rounded-lg transition-all`}
            >
              ← Retour au Radar
            </a>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-2 border-[#232931] border-t-[#D9A441] rounded-full animate-spin" />
            <p className={`${mono.className} text-[#6B7178] text-xs uppercase tracking-widest`}>
              Chargement de la configuration_
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {EXAM_STEPS.map((step, index) => {
              const isActive = step.id === activeStepId;
              const isPassed = step.id < activeStepId;
              const isFirst = index === 0;
              const isLast = index === EXAM_STEPS.length - 1;
              const segmentLit = step.id <= activeStepId;

              return (
                <div key={step.id} className="flex gap-5 md:gap-6">
                  {/* Colonne timeline */}
                  <div className="flex flex-col items-center w-10 flex-shrink-0">
                    <div
                      className={`w-px flex-1 ${
                        isFirst ? 'bg-transparent' : segmentLit ? 'bg-[#D9A441]/40' : 'bg-[#232931]'
                      }`}
                    />
                    <div
                      className={`${mono.className} w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isActive
                          ? 'bg-[#D9A441] border-[#D9A441] text-[#0B0E11] shadow-[0_0_14px_rgba(217,164,65,0.5)]'
                          : isPassed
                            ? 'bg-transparent border-[#D9A441]/40 text-[#D9A441]/70'
                            : 'bg-transparent border-[#2A3038] text-[#4A5057]'
                      }`}
                    >
                      {String(step.id).padStart(2, '0')}
                    </div>
                    <div
                      className={`w-px flex-1 ${
                        isLast ? 'bg-transparent' : segmentLit ? 'bg-[#D9A441]/40' : 'bg-[#232931]'
                      }`}
                    />
                  </div>

                  {/* Carte de l'épreuve */}
                  <div
                    className={`relative flex-1 mb-6 overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
                      isActive
                        ? 'bg-[#11151A] border-[#D9A441]/60 shadow-[0_0_30px_rgba(217,164,65,0.1)]'
                        : isPassed
                          ? 'bg-[#0E1115] border-[#232931] opacity-60'
                          : 'bg-[#0E1115] border-[#232931] hover:border-[#3A3F45]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                      {/* Infos de l'épreuve */}
                      <div className="flex-1 flex gap-4">
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-md bg-[#1A1E23] border border-[#232931] flex items-center justify-center text-2xl">
                          {step.icon}
                          {isActive && (
                            <>
                              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#D9A441]" />
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#D9A441]" />
                              <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#D9A441]" />
                              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#D9A441]" />
                            </>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2
                            className={`${display.className} text-xl md:text-2xl font-semibold tracking-wide uppercase ${
                              isActive ? 'text-[#F2EFE9]' : 'text-[#7C838B]'
                            }`}
                          >
                            {step.title}
                          </h2>
                          <p className={`${mono.className} text-[#6B7178] text-xs mt-1 mb-3 tracking-wide`}>
                            📍 {step.location}
                          </p>
                          <p
                            className={`text-sm mb-3 leading-relaxed ${
                              isActive ? 'text-[#C5C2BB]' : 'text-[#5A6066]'
                            }`}
                          >
                            {step.description}
                          </p>
                          <p
                            className={`${mono.className} text-[11px] font-bold inline-block px-2 py-1 rounded border ${
                              isActive
                                ? 'text-[#D9A441] bg-[#D9A441]/10 border-[#D9A441]/30'
                                : 'text-[#6B7178] bg-[#1A1E23] border-[#232931]'
                            }`}
                          >
                            BONUS/RÈGLE · {step.bonus}
                          </p>
                        </div>
                      </div>

                      {/* Bouton d'action */}
                      <div className="w-full md:w-auto flex-shrink-0">
                        {isActive ? (
                          <button
                            onClick={() => activateStep(0)}
                            className={`${mono.className} w-full md:w-auto px-6 py-3 bg-[#E0524F]/10 text-[#E0524F] font-bold rounded-xl border border-[#E0524F]/40 hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors`}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E0524F]" />
                            </span>
                            Désactiver (Pause)
                          </button>
                        ) : (
                          <button
                            onClick={() => activateStep(step.id)}
                            className={`${display.className} w-full md:w-auto px-6 py-3 font-bold rounded-xl uppercase tracking-wider text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E11] ${
                              isPassed
                                ? 'bg-[#1A1E23] border border-[#2A3038] text-[#9AA0A6] hover:border-[#D9A441]/50 hover:text-[#D9A441]'
                                : 'bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11]'
                            }`}
                          >
                            {isPassed ? 'Réactiver (Rattrapage)' : "Lancer l'épreuve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- DIFFUSION TIMELINE --- */}
        <div className="bg-[#11151A] border border-[#232931] rounded-2xl p-6 md:p-8 mt-10">
          <h2 className={`${display.className} text-2xl font-semibold text-[#F2EFE9] mb-6 flex items-center gap-3`}>
            <span className="text-[#3FAEC4]">📻</span> Annonces Publiques (Tracker)
          </h2>

          <form onSubmit={publishTimelineEvent} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={timelineMsg}
              onChange={(e) => setTimelineMsg(e.target.value)}
              placeholder="Ex: Gon vient d'éliminer Hisoka..."
              required
              className={`${mono.className} flex-1 bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] placeholder:text-[#4A5057] focus:border-[#3FAEC4] focus:ring-1 focus:ring-[#3FAEC4] outline-none text-sm`}
            />
            <select
              value={timelineType}
              onChange={(e) => setTimelineType(e.target.value)}
              className={`${mono.className} bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] focus:border-[#3FAEC4] outline-none text-sm`}
            >
              <option value="info">Info (Bleu/Gris)</option>
              <option value="success">Succès (Vert)</option>
              <option value="warning">Alerte (Or)</option>
              <option value="danger">Danger (Rouge)</option>
            </select>
            <button
              type="submit"
              className={`${display.className} bg-[#3FAEC4] text-[#0B0E11] px-6 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-[#2C8A9E] transition-colors`}
            >
              Diffuser
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}