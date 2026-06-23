'use client';

import { useState, useEffect } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

type Message = {
  id: string;
  candidateId: string;
  name: string;
  text: string;
  type: string;
  status: string;
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

export default function EnigmaTerminal() {
  const [globalEnigma, setGlobalEnigma] = useState('');
  const [activeEnigma, setActiveEnigma] = useState<any>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [nextLocation, setNextLocation] = useState('');

  const fetchActiveEnigma = async () => {
    const { data } = await supabase
      .from('enigmas')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setActiveEnigma(data);
      if (data.next_location) setNextLocation(data.next_location);
    } else {
      setActiveEnigma(null);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('enigma_responses')
      .select('id, response_text, status, candidate_id, candidates(name)')
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        candidateId: d.candidate_id,
        name: d.candidates?.name || 'Inconnu',
        text: d.response_text,
        type: 'enigma',
        status: d.status
      }));
      setMessages(formatted);
    }
  };

  useEffect(() => {
    fetchActiveEnigma();
    fetchMessages();

    const channel = supabase.channel('enigma_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enigma_responses' }, () => {
        fetchMessages();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enigmas' }, () => {
        fetchActiveEnigma();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalEnigma.trim()) return;
    
    // Deactivate previous enigmas
    await supabase.from('enigmas').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert new
    await supabase.from('enigmas').insert({
      content: globalEnigma,
      is_active: true
    });
    
    setGlobalEnigma('');
  };

  const handleValidation = async (msgId: string, isValid: boolean) => {
    if (isValid && !nextLocation.trim()) {
      alert("Veuillez saisir la localisation de la prochaine épreuve (dans la case en bas à gauche) avant de valider une bonne réponse.");
      return;
    }
    
    const newStatus = isValid ? 'approved' : 'rejected';
    const { error } = await supabase.from('enigma_responses').update({ status: newStatus }).eq('id', msgId);

    if (error) {
      alert("Erreur lors de la mise à jour: " + error.message);
      return;
    }

    if (isValid && activeEnigma) {
      await supabase.from('enigmas').update({ next_location: nextLocation }).eq('id', activeEnigma.id);
    }

    // Mise à jour immédiate de l'UI
    fetchMessages();
  };

  const pending  = messages.filter(m => m.status === 'pending').length;
  const approved = messages.filter(m => m.status === 'approved').length;
  const rejected = messages.filter(m => m.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(217,164,65,0.05)" />

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-10 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
          <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className={`${mono.className} text-[#D9A441] text-[10px] uppercase tracking-[0.25em] mb-1`}>
                ÉCRAN GM // COMMUNICATIONS SECRÈTES
              </p>
              <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] uppercase tracking-wider`}>
                Terminal des <span className="text-[#D9A441]">Énigmes</span>
              </h1>
              <p className={`${mono.className} text-[#6B7178] text-xs mt-2`}>
                Diffusez vos énigmes, analysez les réponses et révélez les lieux cachés.
              </p>
            </div>

            {/* Compteurs */}
            <div className="flex gap-3">
              <div className="relative bg-[#0B0E11] border border-[#E0524F]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <Reticle color="#E0524F" size={8} />
                <p className={`${mono.className} text-[#E0524F] text-xl font-bold`}>{pending}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>En attente</p>
              </div>
              <div className="bg-[#0B0E11] border border-[#5FA876]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <p className={`${mono.className} text-[#5FA876] text-xl font-bold`}>{approved}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>Validés</p>
              </div>
              <div className="bg-[#0B0E11] border border-[#4A5057]/20 rounded-xl px-4 py-2.5 text-center min-w-[56px]">
                <p className={`${mono.className} text-[#6B7178] text-xl font-bold`}>{rejected}</p>
                <p className={`${mono.className} text-[#4A5057] text-[8px] uppercase tracking-widest`}>Rejetés</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Grille ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            {/* Diffuser une énigme */}
            <div className="bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(217,164,65,0.04)]">
              <div className="h-[2px] w-full bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
              <div className="p-6">
                <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-1`}>
                  Diffuser une énigme
                </h2>
                <p className={`${mono.className} text-[#4A5057] text-[10px] uppercase tracking-widest mb-5`}>
                  Transmission globale · tous candidats
                </p>

                <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
                  <textarea
                    rows={4}
                    value={globalEnigma}
                    onChange={e => setGlobalEnigma(e.target.value)}
                    placeholder="Rédigez l'énigme pour faire deviner le prochain lieu..."
                    className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#D9A441] outline-none resize-none transition-colors`}
                  />
                  <button
                    type="submit"
                    className={`${display.className} w-full bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11] font-bold py-3 rounded-xl uppercase tracking-widest transition-colors`}
                  >
                    ▶ Transmettre
                  </button>
                </form>

                {/* Énigme active */}
                {activeEnigma && (
                  <div className="relative mt-5 p-4 bg-[#D9A441]/08 border border-[#D9A441]/30 rounded-xl overflow-hidden">
                    <Reticle color="#D9A441" size={8} />
                    <p className={`${mono.className} text-[#D9A441] text-[9px] uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D9A441]" />
                      </span>
                      Énigme active en cours de diffusion
                    </p>
                    <p className={`${mono.className} text-sm text-[#C5C2BB] italic`}>
                      &ldquo;{activeEnigma.content}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Localisation cible */}
            <div className="relative bg-[#11151A] border border-[#3FAEC4]/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(63,174,196,0.08)]">
              <div className="h-[2px] w-full bg-gradient-to-r from-[#3FAEC4] via-[#3FAEC4]/40 to-transparent" />
              <div className="p-6">
                <Reticle color="#3FAEC4" size={10} />
                <h2 className={`${display.className} text-[#3FAEC4] text-lg font-bold uppercase mb-1`}>
                  Localisation Cible
                </h2>
                <p className={`${mono.className} text-[#4A5057] text-[10px] uppercase tracking-widest mb-4`}>
                  Lieu révélé en cas de bonne réponse
                </p>
                <input
                  type="text"
                  value={nextLocation}
                  onChange={e => setNextLocation(e.target.value)}
                  placeholder="Ex: Rond-point Nlongkak..."
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#3FAEC4] outline-none transition-colors`}
                />
                {nextLocation && (
                  <p className={`${mono.className} text-[#3FAEC4] text-[10px] mt-2 uppercase tracking-widest`}>
                    ✓ Destination configurée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Colonne droite : Boîte de réception ─────────────────────────── */}
          <div className="lg:col-span-2 bg-[#11151A] border border-[#232931] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(224,82,79,0.04)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#E0524F] via-[#E0524F]/40 to-transparent" />
            <div className="p-6">
              <h2 className={`${display.className} text-[#F2EFE9] text-xl font-bold uppercase mb-6 flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E0524F]" />
                </span>
                Réponses des candidats
              </h2>

              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10 border border-[#232931] border-dashed rounded-xl">
                    <p className={`${mono.className} text-[#6B7178] text-sm uppercase tracking-widest`}>Aucune réponse reçue</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isApproved = msg.status === 'approved';
                    const isRejected = msg.status === 'rejected';
                    const isPending  = msg.status === 'pending';
                    const isEgg      = msg.type === 'egg_code';

                    return (
                      <div
                        key={msg.id}
                        className={`relative p-5 rounded-xl border transition-all ${
                          isApproved ? 'bg-[#5FA876]/05 border-[#5FA876]/30' :
                          isRejected ? 'bg-[#1A0E0E] border-[#E0524F]/20 opacity-55' :
                          'bg-[#0B0E11] border-[#232931] hover:border-[#D9A441]/20'
                        }`}
                      >
                        {isPending && <Reticle color="#D9A441" size={8} />}
                        {isApproved && <Reticle color="#5FA876" size={8} />}

                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                          <div className="flex-1">
                            {/* Entête candidat */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`${mono.className} text-[#D9A441] text-[10px] border border-[#D9A441]/30 px-2 py-0.5 rounded-md`}>
                                #{msg.candidateId}
                              </span>
                              <span className={`${display.className} text-[#F2EFE9] uppercase tracking-wider text-sm`}>
                                {msg.name}
                              </span>
                              {/* Type badge */}
                              <span
                                className={`${mono.className} text-[9px] uppercase px-2 py-0.5 rounded border ${
                                  isEgg
                                    ? 'text-[#D9A441] border-[#D9A441]/30 bg-[#D9A441]/08'
                                    : 'text-[#9AA0A6] border-[#232931] bg-[#1A1E23]'
                                }`}
                              >
                                {isEgg ? '🥚 Code Œuf' : '💬 Énigme'}
                              </span>
                            </div>

                            {/* Message */}
                            <div className={`px-4 py-2.5 rounded-lg border ${
                              isEgg
                                ? 'bg-[#D9A441]/05 border-[#D9A441]/20'
                                : 'bg-[#1A1E23] border-[#232931]'
                            }`}>
                              <p className={`${mono.className} text-sm ${isEgg ? 'text-[#D9A441] font-bold tracking-[0.15em]' : 'text-[#C5C2BB] italic'}`}>
                                {isEgg ? msg.text : `« ${msg.text} »`}
                              </p>
                            </div>
                          </div>

                          {/* Actions / Verdict */}
                          {isPending ? (
                            <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                              <button
                                onClick={() => handleValidation(msg.id, false)}
                                className={`${display.className} flex-1 md:flex-none px-5 py-2 bg-[#1A0E0E] text-[#E0524F] border border-[#E0524F]/30 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
                              >
                                ✕ Faux
                              </button>
                              <button
                                onClick={() => handleValidation(msg.id, true)}
                                className={`${display.className} flex-1 md:flex-none px-5 py-2 bg-[#3FAEC4]/10 text-[#3FAEC4] border border-[#3FAEC4]/30 rounded-lg hover:bg-[#3FAEC4] hover:text-[#0B0E11] uppercase tracking-wider text-sm transition-colors`}
                              >
                                ✓ Correct
                              </button>
                            </div>
                          ) : (
                            <div className="flex-shrink-0 text-right">
                              <span
                                className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg border ${
                                  isApproved
                                    ? 'text-[#5FA876] border-[#5FA876]/30 bg-[#5FA876]/08'
                                    : 'text-[#E0524F] border-[#E0524F]/20 bg-[#E0524F]/05'
                                }`}
                              >
                                {isApproved && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5FA876] opacity-60" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5FA876]" />
                                  </span>
                                )}
                                {isApproved ? 'Validé' : 'Rejeté'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
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