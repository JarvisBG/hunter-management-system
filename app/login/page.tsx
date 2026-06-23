'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// ─── Coin de visée (identique à admin/page.tsx) ───────────────────────────────
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

// ─── Fond scanline + vignette (identique à admin/page.tsx) ───────────────────
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

export default function CandidateLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Fetch candidate by id (passcode)
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', passcode)
      .single();

    if (error || !candidate) {
      setErrorMsg('Code secret invalide ou candidat introuvable.');
      setLoading(false);
      return;
    }

    // Verify name (case-insensitive for convenience)
    if (candidate.name.toLowerCase() !== username.toLowerCase()) {
      setErrorMsg('Identifiant incorrect pour ce code.');
      setLoading(false);
      return;
    }

    // Success: redirect to candidate session
    router.push(`/candidat/${candidate.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] flex flex-col justify-center items-center relative selection:bg-[#D9A441]/30 p-4 overflow-hidden">
      <Backdrop tint="rgba(217,164,65,0.08)" />

      {/* Ligne horizontale animée en arrière-plan */}
      <div className="pointer-events-none fixed top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D9A441]/20 to-transparent z-0 animate-pulse" />

      <div className="relative z-10 w-full max-w-sm">

        {/* ── Logo / En-tête ─────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          {/* Emblème avec Reticle */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-[#11151A] border border-[#D9A441]/50 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(217,164,65,0.15)]">
                <span
                  className={`${display.className} text-[#D9A441] text-3xl font-black`}
                  style={{ textShadow: '0 0 20px rgba(217,164,65,0.5)' }}
                >
                  HXH
                </span>
              </div>
              <Reticle color="#D9A441" size={14} />
            </div>
          </div>

          {/* Badge "Portail sécurisé" */}
          <div className="inline-flex items-center gap-2 bg-[#D9A441]/10 border border-[#D9A441]/30 px-3 py-1 rounded-full mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A441]" />
            </span>
            <span className={`${mono.className} text-[#D9A441] text-[10px] font-bold uppercase tracking-widest`}>
              Portail sécurisé HMS
            </span>
          </div>

          <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] tracking-widest uppercase`}>
            Licence <span className="text-[#D9A441]">Hunter</span>
          </h1>
          <p className={`${mono.className} text-[#6B7178] text-xs mt-2 tracking-[0.2em] uppercase`}>
            Portail d&apos;authentification
          </p>
        </div>

        {/* ── Formulaire ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleLogin}
          className="bg-[#11151A] border border-[#232931] rounded-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Bande dorée animée en haut */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D9A441] to-transparent animate-pulse" />

          <div className="p-8 space-y-6">
            {/* Identifiant */}
            <div>
              <label className={`${mono.className} block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                Identifiant Candidat
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#4A5057] group-focus-within:text-[#D9A441] transition-colors">
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg py-3 pl-10 pr-3 text-[#E8E6E1] text-sm focus:border-[#D9A441] focus:shadow-[0_0_0_1px_rgba(217,164,65,0.3)] outline-none transition-all placeholder:text-[#4A5057]`}
                  placeholder="Nom exact ou Pseudo"
                />
              </div>
            </div>

            {/* Code d'accès */}
            <div>
              <label className={`${mono.className} block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                Code d&apos;accès secret
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#4A5057] group-focus-within:text-[#D9A441] transition-colors">
                  🔑
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg py-3 pl-10 pr-10 text-[#E8E6E1] text-sm focus:border-[#D9A441] focus:shadow-[0_0_0_1px_rgba(217,164,65,0.3)] tracking-widest outline-none transition-all placeholder:text-[#4A5057]`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#4A5057] hover:text-[#D9A441] transition-colors"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-[#E0524F]/10 border border-[#E0524F]/30 text-[#E0524F] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${display.className} w-full relative overflow-hidden bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11] font-bold py-3.5 rounded-lg uppercase tracking-widest transition-all disabled:opacity-60 mt-2 shadow-[0_0_20px_rgba(217,164,65,0.25)] hover:shadow-[0_0_30px_rgba(217,164,65,0.4)]`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0B0E11]/40 border-t-[#0B0E11] rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                'Ouvrir la session'
              )}
            </button>
          </div>

          {/* Terminal footer dans le formulaire */}
          <div className="border-t border-[#1A1E23] px-8 py-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]/50" />
            <p className={`${mono.className} text-[#4A5057] text-[10px] uppercase tracking-widest`}>
              HMS · Hunter Management System · v2.0
            </p>
          </div>
        </form>

        {/* ── Avertissement ──────────────────────────────────────────────── */}
        <div className="mt-6 bg-[#1A0E0E] border border-[#E0524F]/20 rounded-xl px-5 py-4">
          <p className={`${mono.className} text-[#E0524F]/60 text-[10px] leading-relaxed`}>
            <span className="text-[#E0524F] font-bold">&gt; Avertissement : </span>
            L&apos;usurpation d&apos;une licence Hunter entraîne l&apos;élimination immédiate de l&apos;examen.
          </p>
        </div>

      </div>
    </div>
  );
}