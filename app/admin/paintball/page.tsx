"use client";

import { useEffect, useState } from 'react';
import { Inter, Outfit, Roboto_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';
const inter = Inter({ subsets: ['latin'] });
const display = Outfit({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'] });
const mono = Roboto_Mono({ subsets: ['latin'] });

function Backdrop({ tint }: { tint?: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse at top, ${tint || 'rgba(217,164,65,0.06)'}, transparent 55%)` }} />
    </>
  );
}

type Candidate = {
  id: string;
  name: string;
  photo_url: string;
  status: 'active' | 'eliminated' | 'qualified';
};

export default function AdminPaintball() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .order('id', { ascending: true });

    if (data) setCandidates(data);
  };

  useEffect(() => {
    fetchCandidates();
    const channel = supabase.channel('admin_paintball')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchCandidates)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDecision = async (id: string, decision: 'qualified' | 'eliminated') => {
    if (!window.confirm(`Voulez-vous vraiment passer ce candidat en statut : ${decision.toUpperCase()} ?`)) return;
    await supabase.from('candidates').update({ status: decision }).eq('id', id);
    fetchCandidates();
  };

  const startStep = async () => {
    if (!window.confirm("Remettre en lice tous les qualifiés pour cette épreuve ?")) return;
    const qualified = candidates.filter(c => c.status !== 'eliminated');
    for (const c of qualified) {
      await supabase.from('candidates').update({ status: 'active' }).eq('id', c.id);
    }
    fetchCandidates();
  };

  const activeCount = candidates.filter(c => c.status === 'active').length;
  const qualifiedCount = candidates.filter(c => c.status === 'qualified').length;
  const eliminatedCount = candidates.filter(c => c.status === 'eliminated').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] relative selection:bg-[#D9A441]/30 pb-12">
      <Backdrop tint="rgba(224,82,79,0.05)" />

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        <header className="bg-[#11151A] border border-[#232931] border-t-0 rounded-b-3xl shadow-2xl mb-10 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#E0524F] via-[#E0524F]/40 to-transparent" />
          <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`${mono.className} text-[#E0524F] text-[10px] font-bold uppercase tracking-[0.25em]`}>
                  Étape 05
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E0524F]/10 border border-[#E0524F]/30 text-[#E0524F] text-[9px] font-bold uppercase tracking-widest">
                  Live Control
                </span>
              </div>
              <h1 className={`${display.className} text-3xl md:text-4xl font-bold text-[#F2EFE9] tracking-wide uppercase`}>
                Brigade Fantôme
              </h1>
              <p className={`${mono.className} text-[#9AA0A6] text-xs mt-2`}>Supervision de l'épreuve de Paintball</p>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <button 
                onClick={startStep}
                className={`${display.className} bg-[#E0524F]/10 hover:bg-[#E0524F] text-[#E0524F] hover:text-[#0B0E11] border border-[#E0524F]/30 px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all font-bold`}
              >
                ► Démarrer l'épreuve
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 border-t border-[#232931] divide-x divide-[#232931]">
            <div className="px-6 py-4 flex flex-col items-center">
              <span className={`${mono.className} text-[10px] text-[#9AA0A6] uppercase tracking-widest mb-1`}>En Lice</span>
              <span className={`${display.className} text-2xl font-bold text-[#5FA876]`}>{activeCount}</span>
            </div>
            <div className="px-6 py-4 flex flex-col items-center bg-[#D9A441]/5">
              <span className={`${mono.className} text-[10px] text-[#D9A441] uppercase tracking-widest mb-1`}>Qualifiés</span>
              <span className={`${display.className} text-2xl font-bold text-[#D9A441]`}>{qualifiedCount}</span>
            </div>
            <div className="px-6 py-4 flex flex-col items-center bg-[#E0524F]/5">
              <span className={`${mono.className} text-[10px] text-[#E0524F] uppercase tracking-widest mb-1`}>Éliminés</span>
              <span className={`${display.className} text-2xl font-bold text-[#E0524F]`}>{eliminatedCount}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.filter(c => c.status !== 'eliminated').map(candidate => (
            <div key={candidate.id} className="bg-[#11151A] rounded-2xl border border-[#232931] overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-[#232931] flex justify-between items-center bg-[#0B0E11]/50">
                <span className={`${mono.className} text-[#6B7178] text-[10px]`}>#{candidate.id}</span>
                {candidate.status === 'qualified' ? (
                  <span className={`${mono.className} text-[9px] bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30 px-2 py-0.5 rounded uppercase tracking-widest`}>
                    Qualifié
                  </span>
                ) : (
                  <span className={`${mono.className} text-[9px] bg-[#5FA876]/10 text-[#5FA876] border border-[#5FA876]/30 px-2 py-0.5 rounded uppercase tracking-widest`}>
                    En lice
                  </span>
                )}
              </div>
              
              <div className="p-6 flex flex-col items-center text-center flex-grow">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-[#232931] rounded-full animate-pulse" />
                  <img src={candidate.photo_url} alt={candidate.name} className="relative w-full h-full object-cover rounded-full border-2 border-[#3A4048]" />
                  {candidate.status === 'qualified' && (
                    <div className="absolute -bottom-2 -right-2 bg-[#D9A441] text-[#0B0E11] text-xs w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#11151A]">
                      ⭐
                    </div>
                  )}
                </div>
                
                <h3 className={`${display.className} text-xl uppercase text-[#F2EFE9] mb-1`}>{candidate.name}</h3>
                <p className={`${mono.className} text-[#6B7178] text-xs`}>Bataille Royale</p>
              </div>

              <div className="grid grid-cols-2 border-t border-[#232931] divide-x divide-[#232931]">
                <button
                  onClick={() => handleDecision(candidate.id, 'eliminated')}
                  className={`${display.className} py-4 text-[#E0524F] hover:bg-[#E0524F] hover:text-[#0B0E11] uppercase text-sm font-bold tracking-widest transition-colors`}
                >
                  Tuer
                </button>
                <button
                  onClick={() => handleDecision(candidate.id, 'qualified')}
                  disabled={candidate.status === 'qualified'}
                  className={`${display.className} py-4 text-[#D9A441] hover:bg-[#D9A441] hover:text-[#0B0E11] uppercase text-sm font-bold tracking-widest transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#D9A441]`}
                >
                  Qualifier
                </button>
              </div>
            </div>
          ))}

          {candidates.filter(c => c.status === 'eliminated').map(candidate => (
            <div key={candidate.id} className="bg-[#11151A]/50 rounded-2xl border border-[#E0524F]/10 overflow-hidden flex flex-col opacity-50 grayscale">
              <div className="p-4 border-b border-[#232931] flex justify-between items-center bg-[#0B0E11]/50">
                <span className={`${mono.className} text-[#6B7178] text-[10px]`}>#{candidate.id}</span>
                <span className={`${mono.className} text-[9px] bg-[#E0524F]/10 text-[#E0524F] border border-[#E0524F]/30 px-2 py-0.5 rounded uppercase tracking-widest`}>
                  Éliminé
                </span>
              </div>
              <div className="p-6 flex items-center gap-4">
                <img src={candidate.photo_url} alt={candidate.name} className="w-12 h-12 object-cover rounded-full" />
                <h3 className={`${display.className} text-lg uppercase text-[#F2EFE9]`}>{candidate.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
