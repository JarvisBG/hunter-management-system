'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { candidateLogout } from '@/app/actions/auth';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

type Candidate = {
  id: string;
  name: string;
  photo_url: string;
  status: string;
  session_arrival: number;
};

const MOCK_OPPONENT = null;
const MOCK_POINTS = 0;
const MOCK_ENIGMA_ACTIVE = false;

const STATUS_META: Record<string, { label: string; dot: string; pill: string; accent: string }> = {
  active: { label: 'En lice', dot: 'bg-[#5FA876]', pill: 'bg-[#5FA876]/10 text-[#5FA876] border-[#5FA876]/30', accent: '#5FA876' },
  eliminated: { label: 'Éliminé', dot: 'bg-[#E0524F]', pill: 'bg-[#E0524F]/10 text-[#E0524F] border-[#E0524F]/30', accent: '#E0524F' },
  qualified: { label: 'Qualifié', dot: 'bg-[#3FAEC4]', pill: 'bg-[#3FAEC4]/10 text-[#3FAEC4] border-[#3FAEC4]/30', accent: '#3FAEC4' },
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

// ─── Fond commun ─────────────────────────────────────────────────────────────
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

// ─── TAMPON VISUEL DE FIN D'ÉPREUVE ──────────────────────────────────────────
function StepVisual({ status }: { status: 'qualified' | 'eliminated' }) {
  const isQualified = status === 'qualified';
  const color = isQualified ? '#3FAEC4' : '#E0524F';
  const title = isQualified ? 'ÉPREUVE VALIDÉE' : 'ÉCHEC CRITIQUE';
  const subtitle = isQualified ? 'Qualifié pour l\'étape suivante' : 'Disqualification immédiate';
  const icon = isQualified ? '✓' : '✕';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B0E11]/85 backdrop-blur-[4px]">
      <div
        className={`relative flex flex-col items-center justify-center p-8 border-4 border-dashed rounded-2xl transform transition-transform ${isQualified ? '-rotate-3 scale-105' : 'rotate-3 scale-105'}`}
        style={{
          borderColor: `${color}80`,
          boxShadow: `0 0 50px ${color}20, inset 0 0 30px ${color}20`,
          background: `radial-gradient(circle, ${color}10 0%, transparent 80%)`
        }}
      >
        <Reticle color={color} size={16} />

        <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 mb-4 bg-[#0B0E11]" style={{ borderColor: color, boxShadow: `0 0 20px ${color}50` }}>
          <span className={`${display.className} text-4xl mb-1`} style={{ color }}>{icon}</span>
        </div>

        <h2
          className={`${display.className} text-3xl font-black uppercase tracking-[0.1em] text-center whitespace-nowrap`}
          style={{ color, textShadow: `0 0 20px ${color}80` }}
        >
          {title}
        </h2>

        <p
          className={`${mono.className} text-[9px] uppercase font-bold tracking-[0.2em] text-center mt-4 bg-[#0B0E11] px-4 py-1.5 border border-current`}
          style={{ color }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function CandidateSurvivalApp() {
  const params = useParams();
  const badgeId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  // Enigmas
  const [activeEnigma, setActiveEnigma] = useState<any>(null);
  const [enigmaResponse, setEnigmaResponse] = useState<any>(null);
  const [enigmaAnswerText, setEnigmaAnswerText] = useState('');
  const [enigmaSending, setEnigmaSending] = useState(false);

  // Global Config
  const [activeStepId, setActiveStepId] = useState<number>(1);

  // Endurance Eggs
  const [eggCode, setEggCode] = useState('');
  const [eggSubmitting, setEggSubmitting] = useState(false);
  const [eggStatus, setEggStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  // Duels State
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const [opponent, setOpponent] = useState<any>(null);

  // Cuisine State
  const [dishStatus, setDishStatus] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishSubmitting, setDishSubmitting] = useState(false);

  // Badges State
  const [badgeTarget, setBadgeTarget] = useState<any>(null);
  const [badgePoints, setBadgePoints] = useState(0);
  const [badgeCode, setBadgeCode] = useState('');
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [lastHunt, setLastHunt] = useState<any>(null);

  useEffect(() => {
    const fetchEggStatus = async () => {
      const { data } = await supabase.from('eggs').select('is_claimed').eq('claimed_by', badgeId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setEggStatus(data.is_claimed ? 'approved' : 'pending');
      } else {
        setEggStatus(prev => prev === 'pending' || prev === 'rejected' ? 'rejected' : null);
      }
    };

    const fetchDuel = async () => {
      const { data } = await supabase.from('duels')
        .select('*')
        .or(`player1_id.eq.${badgeId},player2_id.eq.${badgeId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveDuel(data);
        if (data.status === 'pending') {
          const opponentId = data.player1_id === badgeId ? data.player2_id : data.player1_id;
          if (opponentId) {
            const { data: oppData } = await supabase.from('candidates').select('*').eq('id', opponentId).single();
            setOpponent(oppData);
          } else {
            setOpponent('SOLO');
          }
        }
      } else {
        setActiveDuel(null);
        setOpponent(null);
      }
    };

    const fetchDish = async () => {
      const { data } = await supabase.from('cuisine_dishes')
        .select('*')
        .eq('candidate_id', badgeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setDishStatus(data.status);
      } else {
        setDishStatus(null);
      }
    };

    const fetchBadgeData = async () => {
      // Points
      const { data: sData } = await supabase.from('badge_hunts')
        .select('points')
        .eq('candidate_id', badgeId)
        .eq('status', 'approved');
      if (sData) {
        setBadgePoints(sData.reduce((acc, curr) => acc + curr.points, 0));
      }

      // Target
      const { data: tData } = await supabase.from('badge_targets')
        .select('*')
        .eq('candidate_id', badgeId)
        .maybeSingle();

      // Last hunt
      const { data: hData } = await supabase.from('badge_hunts')
        .select('*')
        .eq('candidate_id', badgeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (hData) setLastHunt(hData);
      
      if (tData && tData.target_id) {
        const { data: cData } = await supabase.from('candidates').select('*').eq('id', tData.target_id).single();
        setBadgeTarget(cData);
      } else {
        setBadgeTarget(null);
      }
    };

    const fetchCandidate = async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', badgeId)
        .single();

      if (data) {
        setCandidate(data);
      }
      await fetchEggStatus();
      await fetchDuel();
      await fetchDish();
      await fetchBadgeData();
      setLoading(false);
    };

    fetchCandidate();

    const fetchEnigmas = async () => {
      const { data: enigma } = await supabase.from('enigmas').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
      if (enigma) {
        setActiveEnigma(enigma);
        const { data: response } = await supabase.from('enigma_responses').select('*').eq('enigma_id', enigma.id).eq('candidate_id', badgeId).order('created_at', { ascending: false }).limit(1).single();
        setEnigmaResponse(response);
      } else {
        setActiveEnigma(null);
        setEnigmaResponse(null);
      }
    };
    fetchEnigmas();

    const fetchGlobalConfig = async () => {
      const { data } = await supabase.from('global_config').select('active_step_id').eq('id', 1).single();
      if (data) setActiveStepId(data.active_step_id);
    };
    fetchGlobalConfig();

    // Souscription aux changements temps réel du profil
    const channel = supabase
      .channel(`candidate_${badgeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidates', filter: `id=eq.${badgeId}` },
        (payload) => {
          setCandidate(payload.new as Candidate);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enigmas' }, () => fetchEnigmas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enigma_responses', filter: `candidate_id=eq.${badgeId}` }, () => fetchEnigmas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eggs', filter: `claimed_by=eq.${badgeId}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setEggStatus('rejected');
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.is_claimed) setEggStatus('approved');
        } else if (payload.eventType === 'INSERT') {
          setEggStatus('pending');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_config', filter: 'id=eq.1' }, (payload) => {
        if (payload.new && payload.new.active_step_id !== undefined) setActiveStepId(payload.new.active_step_id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels' }, () => fetchDuel())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cuisine_dishes', filter: `candidate_id=eq.${badgeId}` }, () => fetchDish())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'badge_hunts', filter: `candidate_id=eq.${badgeId}` }, () => fetchBadgeData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'badge_targets', filter: `candidate_id=eq.${badgeId}` }, () => fetchBadgeData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_config' }, () => fetchGlobalConfig())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [badgeId]);

  const handleSendDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || dishSubmitting) return;
    setDishSubmitting(true);
    await supabase.from('cuisine_dishes').insert({ candidate_id: badgeId, dish_name: dishName.trim(), status: 'pending' });
    setDishName('');
    setDishSubmitting(false);
    setDishStatus('pending');
  };

  const handleSendBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeCode.trim() || badgeSubmitting) return;
    setBadgeSubmitting(true);
    await supabase.from('badge_hunts').insert({ candidate_id: badgeId, scanned_code: badgeCode.trim(), status: 'pending' });
    setBadgeCode('');
    setBadgeSubmitting(false);
  };

  const handleSendEnigma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enigmaAnswerText.trim() || !activeEnigma || !candidate) return;
    setEnigmaSending(true);

    if (enigmaResponse && enigmaResponse.status === 'rejected') {
      await supabase.from('enigma_responses').update({ response_text: enigmaAnswerText, status: 'pending' }).eq('id', enigmaResponse.id);
    } else {
      await supabase.from('enigma_responses').insert({
        enigma_id: activeEnigma.id,
        candidate_id: candidate.id,
        response_text: enigmaAnswerText,
        status: 'pending'
      });
    }

    // Force la récupération immédiate pour mettre à jour l'interface
    const { data: enigma } = await supabase.from('enigmas').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
    if (enigma) {
      const { data: response } = await supabase.from('enigma_responses').select('*').eq('enigma_id', enigma.id).eq('candidate_id', badgeId).order('created_at', { ascending: false }).limit(1).single();
      setEnigmaResponse(response);
    }

    setEnigmaAnswerText('');
    setEnigmaSending(false);
  };

  const handleSendEgg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eggCode.trim() || !candidate) return;
    setEggSubmitting(true);

    const { error } = await supabase.from('eggs').insert({
      code: eggCode.trim(),
      claimed_by: candidate.id
    });

    if (error) {
      alert("Erreur: Code déjà soumis par un autre candidat ou invalide.");
    } else {
      setEggStatus('pending');
    }

    setEggCode('');
    setEggSubmitting(false);
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0E11] flex flex-col justify-center items-center gap-4 relative">
      <Backdrop />
      <div className="relative">
        <div className="w-12 h-12 border-2 border-[#1C2028] border-t-[#D9A441] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
        </div>
      </div>
      <p className={`${mono.className} text-[#4A5057] text-[10px] uppercase tracking-[0.3em]`}>
        Connexion Hunter_
      </p>
    </div>
  );

  // ── Accès refusé ──────────────────────────────────────────────────────────
  if (!candidate) return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] flex flex-col justify-center items-center p-6 text-center relative">
      <Backdrop tint="rgba(224,82,79,0.06)" />
      <div className="relative z-10 max-w-xs">
        <div className="relative bg-[#11151A] border border-[#E0524F]/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(224,82,79,0.08)]">
          <Reticle color="#E0524F" size={10} />
          <p className={`${mono.className} text-[#E0524F] text-4xl mb-4`}>✕</p>
          <h1 className={`${display.className} text-2xl font-bold text-[#E0524F] tracking-wide mb-2 uppercase`}>
            Accès Refusé
          </h1>
          <p className={`${mono.className} text-[#4A5057] text-xs`}>Licence non reconnue.</p>
        </div>
        <p className={`${mono.className} text-[#2A3038] text-[9px] uppercase tracking-[0.2em] mt-6`}>
          HMS · Hunter Management System · v2.0
        </p>
      </div>
    </div>
  );

  const meta = STATUS_META[candidate.status];

  // ── Écran d'élimination (Global) ─────────────────────────────────────────
  if (candidate.status === 'eliminated') {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Backdrop tint="rgba(224,82,79,0.08)" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#E0524F] mix-blend-overlay animate-pulse opacity-[0.06]" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs w-full">
          <div className="relative w-32 h-32 mb-6">
            <div className="w-full h-full rounded-xl bg-[#1A1E23] overflow-hidden border border-[#E0524F]/50 grayscale">
              <img src={candidate.photo_url} alt="Éliminé" className="w-full h-full object-cover" />
            </div>
            <Reticle color="#E0524F" size={10} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[2px] bg-[#E0524F]/60 rotate-45 absolute" />
              <div className="w-full h-[2px] bg-[#E0524F]/60 -rotate-45 absolute" />
            </div>
          </div>

          <p className={`${mono.className} text-[#E0524F]/60 text-[10px] uppercase tracking-[0.3em] mb-2`}>
            Badge #{candidate.id}
          </p>
          <h1 className={`${display.className} text-5xl font-bold text-[#E0524F] tracking-widest mb-6 uppercase`}
            style={{ textShadow: '0 0 40px rgba(224,82,79,0.4)' }}>
            ÉLIMINÉ
          </h1>

          <div className="relative bg-[#11151A] border border-[#E0524F]/30 p-5 rounded-2xl w-full">
            <Reticle color="#E0524F" size={8} />
            <p className={`${mono.className} text-[#C5C2BB] text-xs leading-relaxed`}>
              &gt; Fin de l&apos;examen.<br />Remettez votre badge au staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran de qualification (Global) ──────────────────────────────────────
  if (candidate.status === 'qualified') {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Backdrop tint="rgba(63,174,196,0.07)" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs">
          <div className="relative w-44 h-60 mb-8 bg-[#11151A] rounded-2xl border-2 border-[#3FAEC4]/50 shadow-[0_0_40px_rgba(63,174,196,0.2)] p-5 flex flex-col items-center justify-between overflow-hidden">
            <Reticle color="#3FAEC4" size={10} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#3FAEC4]/05 to-transparent pointer-events-none" />
            <p className={`${mono.className} text-[#3FAEC4]/40 text-[8px] uppercase tracking-[0.2em] self-start`}>
              LICENCE HMS
            </p>
            <div className="w-20 h-20 rounded-full bg-[#0B0E11] overflow-hidden border-2 border-[#3FAEC4]/60 shadow-[0_0_15px_rgba(63,174,196,0.3)]">
              <img src={candidate.photo_url} alt="Qualifié" className="w-full h-full object-cover" />
            </div>
            <div className="w-full text-center border-t border-[#3FAEC4]/20 pt-3">
              <h2 className={`${display.className} text-lg font-bold text-[#F2EFE9] uppercase truncate`}>
                {candidate.name}
              </h2>
              <p className={`${mono.className} text-[#3FAEC4] font-black text-xl tracking-widest mt-0.5`}>
                #{candidate.id}
              </p>
            </div>
          </div>

          <h1 className={`${display.className} text-4xl font-bold text-[#3FAEC4] tracking-widest mb-4 uppercase`}
            style={{ textShadow: '0 0 40px rgba(63,174,196,0.4)' }}>
            QUALIFIÉ
          </h1>

          <div className="flex items-center gap-2 bg-[#3FAEC4]/08 border border-[#3FAEC4]/20 rounded-xl px-4 py-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3FAEC4]" />
            </span>
            <p className={`${mono.className} text-[#3FAEC4] text-[10px] uppercase tracking-widest`}>
              Dossier validé · Prochaine étape
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Interfaces des épreuves ───────────────────────────────────────────────

  const renderStep1Endurance = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-[0.25em]`}>Étape 01</span>
          <h3 className={`${display.className} text-xl font-bold text-[#F2EFE9] uppercase mt-1`}>Course d&apos;Endurance</h3>
        </div>
        <span className="text-2xl select-none">🏃</span>
      </div>

      <p className={`${mono.className} text-sm text-[#9AA0A6] leading-relaxed`}>
        Courez jusqu&apos;à la ligne d&apos;arrivée. Seuls les premiers seront qualifiés.
      </p>

      <div className="relative bg-[#0B0E11] border border-[#D9A441]/30 p-4 rounded-xl mt-2 shadow-[0_0_15px_rgba(217,164,65,0.04)]">
        <Reticle color="#D9A441" size={8} />
        <p className={`${mono.className} text-[#D9A441] text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D9A441]" />
          </span>
          Raccourci Œuf Caché
        </p>

        {eggStatus === 'pending' ? (
          <div className="text-center py-3 bg-[#D9A441]/10 rounded-xl border border-[#D9A441]/30">
            <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest`}>Code soumis. En attente de l'arbitre...</p>
          </div>
        ) : eggStatus === 'approved' ? (
          <div className="text-center py-3 bg-[#5FA876]/10 rounded-xl border border-[#5FA876]/30">
            <p className={`${mono.className} text-[#5FA876] text-xs uppercase tracking-widest`}>Œuf validé !</p>
          </div>
        ) : (
          <>
            {eggStatus === 'rejected' && (
              <p className={`${mono.className} text-[#E0524F] text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E0524F]" />
                </span>
                Code refusé par l'arbitre. Réessayez.
              </p>
            )}
            <form onSubmit={handleSendEgg} className="flex gap-2">
              <input
                type="text"
                required
                value={eggCode}
                onChange={e => setEggCode(e.target.value)}
                placeholder="Entrez le code de l'œuf..."
                className={`${mono.className} w-full bg-[#11151A] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#D9A441] outline-none transition-colors`}
              />
              <button disabled={eggSubmitting} type="submit" className={`${display.className} bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11] px-4 rounded-xl uppercase font-bold tracking-wider transition-colors disabled:opacity-50`}>
                OK
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  const renderStep2Duels = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-[0.25em]`}>Étape 02</span>
          <h3 className={`${display.className} text-xl font-bold text-[#F2EFE9] uppercase mt-1`}>Duel de Bandeaux</h3>
        </div>
        <span className="text-2xl select-none">🥷</span>
      </div>

      {!activeDuel ? (
         <div className="relative bg-[#0B0E11] border border-[#232931] p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.02)]">
            <Reticle color="#D9A441" size={8} />
            <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest mt-2 animate-pulse`}>Tirage au sort en cours...</p>
            <p className={`${mono.className} text-[#6B7178] text-[10px] mt-2`}>L'arbitre prépare les combats. Préparez-vous.</p>
         </div>
      ) : activeDuel.status === 'completed' ? (
         <div className="relative bg-[#0B0E11] border border-[#232931] p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.02)]">
            <p className={`${mono.className} text-[#6B7178] text-[10px] uppercase tracking-widest`}>Le duel est terminé.</p>
         </div>
      ) : opponent === 'SOLO' ? (
         <div className="relative bg-[#0B0E11] border border-[#D9A441]/30 p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.04)]">
            <Reticle color="#D9A441" size={8} />
            <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest mb-4`}>Épreuve Spéciale</p>
            <div className="text-5xl mb-4">👑</div>
            <h4 className={`${display.className} text-lg text-[#F2EFE9] uppercase`}>Tirage Imparfait</h4>
            <p className={`${mono.className} text-[#9AA0A6] text-xs mt-4 leading-relaxed`}>
              Vous êtes le seul combattant de votre zone.<br />
              Attendez les instructions de l'arbitre.
            </p>
         </div>
      ) : opponent ? (
         <div className="relative bg-[#0B0E11] border border-[#E0524F]/30 p-5 rounded-xl text-center shadow-[0_0_15px_rgba(224,82,79,0.04)]">
            <Reticle color="#E0524F" size={8} />
            <p className={`${mono.className} text-[#E0524F] text-[10px] uppercase tracking-widest mb-4 flex justify-center items-center gap-1.5`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0524F] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E0524F]" />
              </span>
              Votre adversaire désigné
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <img
                  src={opponent.photo_url}
                  className="w-full h-full rounded-xl border-2 border-[#E0524F]/50 object-cover"
                  alt="Adversaire"
                />
              </div>
              <h4 className={`${display.className} text-lg text-[#F2EFE9] uppercase`}>{opponent.name}</h4>
              <p className={`${mono.className} text-[#4A5057] text-[10px]`}>Badge #{opponent.id}</p>
            </div>
            <p className={`${mono.className} text-[#9AA0A6] text-xs mt-4 leading-relaxed`}>
              Rendez-vous dans la zone de combat.<br />
              Arrachez son bandeau pour vous qualifier.
            </p>
         </div>
      ) : (
         <div className="relative bg-[#0B0E11] border border-[#232931] p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.02)]">
            <Reticle color="#D9A441" size={8} />
            <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest mt-2 animate-pulse`}>Chargement...</p>
         </div>
      )}
    </div>
  );

  const renderStep3Cuisine = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-[0.25em]`}>Étape 03</span>
          <h3 className={`${display.className} text-xl font-bold text-[#F2EFE9] uppercase mt-1`}>Jury Culinaire</h3>
        </div>
        <span className="text-2xl select-none">🍳</span>
      </div>

      <p className={`${mono.className} text-sm text-[#9AA0A6] leading-relaxed`}>
        Cuisinez le plat imposé. Le jury notera votre création.
      </p>

      {dishStatus === 'pending' ? (
         <div className="relative bg-[#0B0E11] border border-[#D9A441]/30 p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.04)]">
            <Reticle color="#D9A441" size={8} />
            <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest mt-2 animate-pulse`}>Plat soumis</p>
            <p className={`${mono.className} text-[#6B7178] text-[10px] mt-2`}>En cours de dégustation par le jury...</p>
         </div>
      ) : dishStatus === 'qualified' || dishStatus === 'eliminated' ? (
         <div className="relative bg-[#0B0E11] border border-[#232931] p-5 rounded-xl text-center shadow-[0_0_15px_rgba(217,164,65,0.02)]">
            <p className={`${mono.className} text-[#6B7178] text-[10px] uppercase tracking-widest`}>Verdict prononcé.</p>
         </div>
      ) : (
        <div className="relative bg-[#0B0E11] border border-[#3FAEC4]/20 p-4 rounded-xl">
          <Reticle color="#3FAEC4" size={8} />
          <label className={`${mono.className} block text-[10px] font-bold text-[#4A5057] uppercase tracking-widest mb-3`}>
            Soumission du Plat
          </label>
          <form onSubmit={handleSendDish} className="flex flex-col gap-2">
            <input
              type="text"
              required
              value={dishName}
              onChange={e => setDishName(e.target.value)}
              placeholder="Nom de votre plat finalisé..."
              className={`${mono.className} w-full bg-[#11151A] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#3FAEC4] outline-none transition-colors`}
            />
            <button disabled={dishSubmitting} type="submit" className={`${display.className} bg-[#3FAEC4] hover:bg-[#3292A5] text-[#0B0E11] py-3 rounded-xl uppercase font-bold tracking-widest transition-colors disabled:opacity-50`}>
              Servir au Jury
            </button>
          </form>
        </div>
      )}
    </div>
  );

  const renderStep4Badges = () => {
    const pct = Math.min(100, Math.round((badgePoints / 6) * 100));
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-[0.25em]`}>Étape 04</span>
            <h3 className={`${display.className} text-xl font-bold text-[#F2EFE9] uppercase mt-1`}>Traque des Badges</h3>
          </div>
          <span className="text-2xl select-none">📛</span>
        </div>

        {badgeTarget && (
          <div className="relative bg-[#0B0E11] border border-[#E0524F]/30 p-5 rounded-xl text-center shadow-[0_0_15px_rgba(224,82,79,0.04)] mb-4">
            <Reticle color="#E0524F" size={8} />
            <p className={`${mono.className} text-[#E0524F] text-[10px] uppercase tracking-widest mb-4 flex justify-center items-center gap-1.5`}>
              Votre Cible Assignée (3 pts)
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <img src={badgeTarget.photo_url} className="w-full h-full rounded-xl border-2 border-[#E0524F]/50 object-cover" alt="Cible" />
              </div>
              <h4 className={`${display.className} text-lg text-[#F2EFE9] uppercase`}>{badgeTarget.name}</h4>
              <p className={`${mono.className} text-[#4A5057] text-[10px]`}>Badge #{badgeTarget.id}</p>
            </div>
          </div>
        )}

        <div className="relative bg-[#0B0E11] border border-[#D9A441]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(217,164,65,0.04)]">
          <Reticle color="#D9A441" size={8} />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`${mono.className} text-[#4A5057] text-[10px] uppercase tracking-widest`}>Points cumulés</p>
              <p className={`${display.className} text-3xl font-bold text-[#D9A441] leading-none mt-1`}>
                {badgePoints}
                <span className={`${mono.className} text-base text-[#3A4048] ml-1`}>/6</span>
              </p>
            </div>
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1C2028" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D9A441" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
              </svg>
              <p className={`${mono.className} absolute inset-0 flex items-center justify-center text-[9px] text-[#D9A441] font-bold`}>{pct}%</p>
            </div>
          </div>
          <div className="h-[3px] w-full bg-[#1C2028] rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #D9A441, #D9A44188)' }} />
          </div>

          {lastHunt && (
            <div className="bg-[#11151A] rounded-lg p-3 text-center border border-[#232931]">
              <p className={`${mono.className} text-[9px] uppercase tracking-widest text-[#6B7178] mb-1`}>Dernière soumission</p>
              <p className={`${mono.className} text-xs font-bold text-[#E8E6E1] mb-1`}>{lastHunt.scanned_code}</p>
              {lastHunt.status === 'pending' && <p className={`${mono.className} text-[9px] text-[#D9A441] animate-pulse`}>En attente d'arbitrage...</p>}
              {lastHunt.status === 'approved' && <p className={`${mono.className} text-[9px] text-[#3FAEC4]`}>Validé (+{lastHunt.points} pts)</p>}
              {lastHunt.status === 'rejected' && <p className={`${mono.className} text-[9px] text-[#E0524F]`}>Refusé</p>}
            </div>
          )}
        </div>

        {badgePoints < 6 && (
          <div className="relative bg-[#0B0E11] border border-[#E0524F]/20 p-4 rounded-xl">
            <Reticle color="#E0524F" size={8} />
            <label className={`${mono.className} block text-[10px] font-bold text-[#4A5057] uppercase tracking-widest mb-3`}>
              Soumettre un code volé
            </label>
            <form onSubmit={handleSendBadge} className="flex gap-2">
              <input type="text" value={badgeCode} onChange={e => setBadgeCode(e.target.value)} required placeholder="Ex: BADGE-44..." className={`${mono.className} w-full bg-[#11151A] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#E0524F] outline-none transition-colors`} />
              <button type="submit" disabled={badgeSubmitting} className={`${display.className} bg-[#E0524F] hover:bg-[#C94744] text-[#0B0E11] px-4 rounded-xl uppercase font-bold tracking-wider transition-colors disabled:opacity-50`}>
                +
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderStep5Paintball = () => (
    <div className="space-y-5 text-center py-4">
      <span className="text-5xl select-none">🔫</span>
      <div>
        <span className={`${mono.className} text-[#E0524F] text-[10px] font-bold uppercase tracking-[0.25em]`}>
          Étape Finale
        </span>
        <h3 className={`${display.className} text-2xl font-bold text-[#F2EFE9] uppercase mt-1`}>
          Brigade Fantôme
        </h3>
      </div>
      <div className="relative bg-[#0B0E11] border border-[#E0524F]/20 p-4 rounded-xl text-left">
        <Reticle color="#E0524F" size={8} />
        <p className={`${mono.className} text-sm text-[#9AA0A6] leading-relaxed`}>
          La zone de tir est ouverte. Survivez en équipe face aux traqueurs.
          L&apos;arbitre principal scellera votre destin.
        </p>
      </div>
    </div>
  );

  // ── Layout principal (candidat actif) ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-10">
      <Backdrop tint="rgba(217,164,65,0.04)" />

      <div className="relative z-10 p-4 max-w-md mx-auto">

        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-8 overflow-hidden">
          <div
            className="h-[3px] w-full"
            style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}55, transparent)` }}
          />
          <div className="p-5 flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className={`w-full h-full rounded-xl overflow-hidden border`} style={{ borderColor: `${meta.accent}44` }}>
                <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover" />
              </div>
              <Reticle color={meta.accent} size={8} />
            </div>

            <div className="flex-1 overflow-hidden">
              <p className={`${mono.className} font-bold text-sm tracking-wide`} style={{ color: meta.accent }}>
                #{candidate.id}
              </p>
              <h1 className={`${display.className} text-xl font-bold text-[#F2EFE9] truncate uppercase`}>
                {candidate.name}
              </h1>
              <div className="mt-1">
                <span className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase font-bold border px-2 py-1 rounded-md ${meta.pill}`}>
                  <span className={`relative flex h-1.5 w-1.5`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${meta.dot}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${meta.dot}`} />
                  </span>
                  {meta.label}
                </span>
              </div>
            </div>

            <div className={`${display.className} text-[#1C2028] text-5xl font-black select-none leading-none flex-shrink-0`}>
              {String(activeStepId).padStart(2, '0')}
            </div>
          </div>
        </header>

        {/* ── Contenu dynamique de l'épreuve ──────────────────────────────── */}
        <main className="relative bg-[#11151A] border border-[#D9A441]/30 shadow-[0_0_25px_rgba(217,164,65,0.06)] rounded-2xl p-5 mb-6 overflow-hidden">

          {/* TAMPON D'OVERLAY DE RÉSULTAT POUR LA SESSION */}
          {candidate.status !== 'active' && (
            <StepVisual status={candidate.status as 'qualified' | 'eliminated'} />
          )}

          <div className="h-[2px] w-full absolute top-0 left-0 bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
          <div className="relative z-10 pt-2">
            {activeStepId === 0 && (
              <div className="flex flex-col items-center justify-center py-6 opacity-70">
                <div className="w-8 h-8 border-2 border-[#232931] border-t-[#D9A441] rounded-full animate-spin mb-4" />
                <p className={`${mono.className} text-[#6B7178] text-xs uppercase tracking-widest text-center`}>
                  En attente des instructions du GM...<br />Veuillez patienter.
                </p>
              </div>
            )}
            {activeStepId === 1 && renderStep1Endurance()}
            {activeStepId === 2 && renderStep2Duels()}
            {activeStepId === 3 && renderStep3Cuisine()}
            {activeStepId === 4 && renderStep4Badges()}
            {activeStepId === 5 && renderStep5Paintball()}
            {activeStepId === 6 && (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-4xl mb-4">🧩</span>
                <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest text-center font-bold`}>
                  Mode Terminal d'Énigmes Activé.<br />Prêtez attention à votre terminal.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* ── Terminal d'énigmes ───────────────────────────────────────────── */}
        {activeEnigma && activeStepId === 6 && (
          <div className={`relative bg-[#11151A] border ${enigmaResponse?.status === 'approved' ? 'border-[#5FA876]/30' : 'border-[#3FAEC4]/30'} rounded-2xl p-5 overflow-hidden shadow-[0_0_20px_rgba(63,174,196,0.06)]`}>
            <div className={`h-[2px] w-full absolute top-0 left-0 bg-gradient-to-r ${enigmaResponse?.status === 'approved' ? 'from-[#5FA876] via-[#5FA876]/40' : 'from-[#3FAEC4] via-[#3FAEC4]/40'} to-transparent`} />
            <Reticle color={enigmaResponse?.status === 'approved' ? '#5FA876' : '#3FAEC4'} size={10} />

            <div className="flex items-center gap-2 mb-4 pt-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${enigmaResponse?.status === 'approved' ? 'bg-[#5FA876]' : 'bg-[#3FAEC4]'} opacity-60`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${enigmaResponse?.status === 'approved' ? 'bg-[#5FA876]' : 'bg-[#3FAEC4]'}`} />
              </span>
              <h3 className={`${display.className} ${enigmaResponse?.status === 'approved' ? 'text-[#5FA876]' : 'text-[#3FAEC4]'} uppercase tracking-wider`}>
                {enigmaResponse?.status === 'approved' ? 'Destination Révélée' : 'Terminal de communication'}
              </h3>
            </div>

            {enigmaResponse?.status === 'approved' ? (
              <div className="bg-[#5FA876]/10 border-l-2 border-[#5FA876] pl-4 py-3 rounded-r-lg mb-2">
                <p className={`${mono.className} text-[#5FA876] text-xs uppercase tracking-widest mb-1`}>Prochaine étape :</p>
                <p className={`${display.className} text-[#F2EFE9] text-xl font-bold`}>{activeEnigma.next_location}</p>
              </div>
            ) : (
              <>
                <div className="bg-[#0B0E11] border-l-2 border-[#3FAEC4]/50 pl-3 py-2 rounded-r-lg mb-4">
                  <p className={`${mono.className} text-[#C5C2BB] text-xs italic leading-relaxed`}>
                    &ldquo;{activeEnigma.content}&rdquo;
                  </p>
                  <p className={`${mono.className} text-[#3FAEC4]/40 text-[9px] uppercase tracking-widest mt-1`}>
                    Énigme du GM
                  </p>
                </div>

                {enigmaResponse?.status === 'pending' ? (
                  <div className="text-center py-3 bg-[#D9A441]/10 rounded-xl border border-[#D9A441]/30">
                    <p className={`${mono.className} text-[#D9A441] text-xs uppercase tracking-widest`}>Analyse de votre réponse...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendEnigma} className="flex flex-col gap-2">
                    {enigmaResponse?.status === 'rejected' && (
                      <p className={`${mono.className} text-[#E0524F] text-[10px] uppercase tracking-widest text-center mb-1`}>
                        Réponse incorrecte, essayez encore.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={enigmaAnswerText}
                        onChange={e => setEnigmaAnswerText(e.target.value)}
                        placeholder="Votre réponse au GM..."
                        className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-xl p-3 text-[#E8E6E1] text-xs placeholder:text-[#2A3038] focus:border-[#3FAEC4] outline-none transition-colors`}
                      />
                      <button disabled={enigmaSending} type="submit" className={`${display.className} bg-[#3FAEC4] hover:bg-[#3292A5] text-[#0B0E11] px-4 rounded-xl uppercase font-bold tracking-wider transition-colors disabled:opacity-50`}>
                        ▶
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Pied de page ────────────────────────────────────────────────── */}
        <div className="pt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => candidateLogout()}
            className={`${mono.className} text-[10px] uppercase font-bold tracking-widest text-[#E0524F] border border-[#E0524F]/30 bg-[#1A0E0E] px-4 py-2 rounded-lg hover:bg-[#E0524F] hover:text-[#0B0E11] transition-all`}
          >
            Se déconnecter
          </button>
          <p className={`${mono.className} text-center text-[#2A3038] text-[9px] uppercase tracking-[0.2em]`}>
            HMS · Hunter Management System · v2.0
          </p>
        </div>

      </div>
    </div>
  );
}