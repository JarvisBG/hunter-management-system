'use client';

import { useState } from 'react';
import { adminLogin } from '@/app/actions/auth';
import { Oswald, JetBrains_Mono } from 'next/font/google';

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
      {tint && (
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse at center, ${tint}, transparent 65%)` }} />
      )}
    </>
  );
}

export default function AdminLogin() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] flex flex-col justify-center items-center relative selection:bg-[#3FAEC4]/30 p-4 overflow-hidden">
      <Backdrop tint="rgba(63,174,196,0.05)" />

      {/* Ligne horizontale animée en arrière-plan */}
      <div className="pointer-events-none fixed top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#3FAEC4]/20 to-transparent z-0 animate-pulse" />

      <div className="relative z-10 w-full max-w-sm">

        {/* ── Logo / En-tête ─────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-[#11151A] border border-[#3FAEC4]/50 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(63,174,196,0.15)]">
                <span className={`${display.className} text-[#3FAEC4] text-4xl mb-1`}>
                  👁️
                </span>
              </div>
              <Reticle color="#3FAEC4" size={14} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#3FAEC4]/10 border border-[#3FAEC4]/30 px-3 py-1 rounded-full mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FAEC4] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FAEC4]" />
            </span>
            <span className={`${mono.className} text-[#3FAEC4] text-[10px] font-bold uppercase tracking-widest`}>
              Accès Restreint
            </span>
          </div>

          <h1 className={`${display.className} text-4xl font-bold text-[#F2EFE9] tracking-widest uppercase`}>
            Game <span className="text-[#3FAEC4]">Master</span>
          </h1>
          <p className={`${mono.className} text-[#6B7178] text-xs mt-2 tracking-[0.2em] uppercase`}>
            Terminal d&apos;Administration
          </p>
        </div>

        {/* ── Formulaire ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#11151A] border border-[#232931] rounded-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Bande animée en haut */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#3FAEC4] to-transparent animate-pulse" />

          <div className="p-8 space-y-6">
            {/* Mot de Passe */}
            <div>
              <label className={`${mono.className} block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                Code d&apos;autorisation
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#4A5057] group-focus-within:text-[#3FAEC4] transition-colors">
                  🔒
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg py-3 pl-10 pr-3 text-[#E8E6E1] text-sm focus:border-[#3FAEC4] focus:shadow-[0_0_0_1px_rgba(63,174,196,0.3)] outline-none transition-all placeholder:text-[#4A5057]`}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-[#E0524F]/10 border border-[#E0524F]/30 rounded-lg p-3 flex items-start gap-2">
                <span className="text-[#E0524F] text-sm mt-0.5">⚠</span>
                <p className={`${mono.className} text-[#E0524F] text-[10px] uppercase tracking-wide leading-relaxed`}>
                  {errorMsg}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`${display.className} relative w-full group overflow-hidden rounded-lg bg-[#3FAEC4] text-[#0B0E11] px-4 py-3 font-bold uppercase tracking-widest hover:bg-[#2C8A9E] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(63,174,196,0.2)] hover:shadow-[0_0_25px_rgba(63,174,196,0.4)]`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0B0E11]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Déchiffrement...
                  </>
                ) : (
                  <>Initialiser le système</>
                )}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
