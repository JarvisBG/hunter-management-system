'use client';

import { useState, useEffect, useMemo } from 'react';
import { Oswald, JetBrains_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Définition du type pour un Candidat
type Candidate = {
  id: string;
  name: string;
  phone: string;
  photo_url: string;
  status: string;
};

const STATUS_META: Record<
  string,
  { label: string; dot: string; pill: string; border: string }
> = {
  active: {
    label: 'En lice',
    dot: 'bg-[#5FA876]',
    pill: 'bg-[#5FA876]/10 text-[#5FA876] border-[#5FA876]/30',
    border: 'border-l-[#5FA876]',
  },
  eliminated: {
    label: 'Éliminé',
    dot: 'bg-[#E0524F]',
    pill: 'bg-[#E0524F]/10 text-[#E0524F] border-[#E0524F]/30',
    border: 'border-l-[#E0524F]',
  },
  qualified: {
    label: 'Qualifié',
    dot: 'bg-[#3FAEC4]',
    pill: 'bg-[#3FAEC4]/10 text-[#3FAEC4] border-[#3FAEC4]/30',
    border: 'border-l-[#3FAEC4]',
  },
};

export default function AdminDashboard() {
  const [badgeId, setBadgeId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération :', error.message);
    } else if (data) {
      setCandidates(data);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    setEditLoading(true);

    let finalPhotoUrl = editingCandidate.photo_url;

    if (editFile) {
      const fileExt = editFile.name.split('.').pop();
      const fileName = `${editingCandidate.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('candidates_photos')
        .upload(fileName, editFile);

      if (uploadError) {
        alert("Erreur lors de l'upload de la nouvelle photo : " + uploadError.message);
        setEditLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('candidates_photos')
        .getPublicUrl(fileName);

      finalPhotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('candidates')
      .update({
        name: editingCandidate.name,
        phone: editingCandidate.phone,
        status: editingCandidate.status,
        photo_url: finalPhotoUrl,
      })
      .eq('id', editingCandidate.id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      setEditingCandidate(null);
      setEditFile(null);
      fetchCandidates();
    }
    setEditLoading(false);
  };

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let photoUrl = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${badgeId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('candidates_photos')
        .upload(fileName, file);

      if (uploadError) {
        alert("Erreur lors de l'upload de la photo : " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('candidates_photos')
        .getPublicUrl(fileName);

      photoUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('candidates').insert([
      {
        id: badgeId,
        name: name,
        phone: phone,
        photo_url: photoUrl,
        status: 'active',
        session_arrival: 2,
      },
    ]);

    if (insertError) {
      alert('Erreur base de données : ' + insertError.message);
    } else {
      setBadgeId('');
      setName('');
      setPhone('');
      setFile(null);
      fetchCandidates();
    }
    setLoading(false);
  };

  const counts = useMemo(
    () => ({
      total: candidates.length,
      active: candidates.filter((c) => c.status === 'active').length,
      qualified: candidates.filter((c) => c.status === 'qualified').length,
      eliminated: candidates.filter((c) => c.status === 'eliminated').length,
    }),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [candidates, query]);

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
          background:
            'radial-gradient(ellipse at top, rgba(217,164,65,0.06), transparent 55%)',
        }}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-[1500px] mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-[#232931] pb-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className={`${mono.className} text-[#D9A441]/70 text-xs tracking-[0.2em] mb-2`}>
                &gt; TERMINAL EXAMINATEUR — ACCÈS AUTORISÉ_
              </p>
              <h1
                className={`${display.className} text-4xl md:text-5xl font-bold text-[#F2EFE9] tracking-wide uppercase`}
              >
                HMS <span className="text-[#D9A441]">// CORE</span>
              </h1>
              <p className={`${mono.className} text-[#6B7178] text-xs mt-2 tracking-wide`}>
                Système de gestion · Hunter Exam
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5FA876] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5FA876]"></span>
                </span>
                <span className={`${mono.className} text-[10px] text-[#5FA876] tracking-widest uppercase`}>
                  Système opérationnel
                </span>
              </div>
              <button
                className="bg-[#1A0E0E] border border-[#E0524F]/50 px-6 py-2.5 rounded text-[#E0524F] font-bold uppercase text-sm tracking-wider hover:bg-[#E0524F] hover:text-[#0B0E11] hover:border-[#E0524F] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0524F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E11]"
              >
                Kill Switch Global
              </button>
            </div>
          </div>

          {/* Bandeau de statistiques */}
          <div className="flex flex-wrap items-stretch gap-px bg-[#232931] rounded-lg overflow-hidden border border-[#232931] w-fit">
            {[
              { label: 'Total', value: counts.total, color: 'text-[#E8E6E1]' },
              { label: 'En lice', value: counts.active, color: 'text-[#5FA876]' },
              { label: 'Qualifiés', value: counts.qualified, color: 'text-[#3FAEC4]' },
              { label: 'Éliminés', value: counts.eliminated, color: 'text-[#E0524F]' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0E1115] px-5 py-3 min-w-[110px]">
                <p className={`${mono.className} text-[10px] uppercase tracking-widest text-[#6B7178] mb-1`}>
                  {stat.label}
                </p>
                <p className={`${mono.className} text-2xl font-bold ${stat.color}`}>
                  {String(stat.value).padStart(2, '0')}
                </p>
              </div>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module d'Enrôlement */}
          <section className="bg-[#11151A] p-6 md:p-8 rounded-2xl border border-[#232931] lg:col-span-1 h-fit relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#D9A441] via-[#D9A441]/40 to-transparent" />
            <p className={`${mono.className} text-[10px] tracking-[0.2em] text-[#D9A441]/70 uppercase mb-1`}>
              Dossier d&apos;intake
            </p>
            <h2 className={`${display.className} text-2xl font-semibold text-[#F2EFE9] mb-6`}>
              Nouvel Enrôlement
            </h2>

            <form onSubmit={handleEnrollment} className="space-y-5">
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Numéro de Badge
                </label>
                <input
                  type="number"
                  required
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] placeholder:text-[#4A5057] focus:border-[#D9A441] focus:ring-1 focus:ring-[#D9A441] outline-none transition-all`}
                  placeholder="Ex: 405"
                />
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Identité
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] placeholder:text-[#4A5057] focus:border-[#D9A441] focus:ring-1 focus:ring-[#D9A441] outline-none transition-all"
                  placeholder="Nom complet ou Pseudo"
                />
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] placeholder:text-[#4A5057] focus:border-[#D9A441] focus:ring-1 focus:ring-[#D9A441] outline-none transition-all`}
                  placeholder="+237 ..."
                />
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Photo du Candidat
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-[#9AA0A6] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-[#D9A441]/30 file:text-xs file:font-bold file:bg-[#D9A441]/10 file:text-[#D9A441] hover:file:bg-[#D9A441]/20 file:transition-colors cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${display.className} w-full mt-4 bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11] font-bold py-4 rounded-lg uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151A]`}
              >
                {loading ? 'Traitement...' : 'Générer le Profil'}
              </button>
            </form>
          </section>

          {/* Le Radar des Candidats */}
          <section className="bg-[#11151A] p-6 md:p-8 rounded-2xl border border-[#232931] lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <p className={`${mono.className} text-[10px] tracking-[0.2em] text-[#3FAEC4]/70 uppercase mb-1`}>
                  Surveillance en direct
                </p>
                <h2 className={`${display.className} text-2xl font-semibold text-[#F2EFE9]`}>
                  Base de Données
                </h2>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder=">_ Rechercher par nom ou badge"
                className={`${mono.className} bg-[#0B0E11] border border-[#232931] rounded-lg px-4 py-2 text-sm text-[#E8E6E1] placeholder:text-[#4A5057] focus:border-[#D9A441] focus:ring-1 focus:ring-[#D9A441] outline-none transition-all w-full sm:w-64`}
              />
            </div>

            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-[#232931] rounded-xl gap-2">
                <p className={`${mono.className} text-[#6B7178] text-sm uppercase tracking-widest`}>
                  Aucun dossier enregistré
                </p>
                <p className={`${mono.className} text-[#4A5057] text-xs`}>
                  Enrôlez le premier candidat pour démarrer le suivi.
                </p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] border border-dashed border-[#232931] rounded-xl">
                <p className={`${mono.className} text-[#6B7178] text-sm uppercase tracking-widest`}>
                  Aucun résultat pour &quot;{query}&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCandidates.map((candidate) => {
                  const meta = STATUS_META[candidate.status] ?? {
                    label: candidate.status,
                    dot: 'bg-[#6B7178]',
                    pill: 'bg-[#6B7178]/10 text-[#6B7178] border-[#6B7178]/30',
                    border: 'border-l-[#6B7178]',
                  };
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setEditingCandidate({ ...candidate })}
                      className={`cursor-pointer bg-[#0E1115] border border-[#232931] ${meta.border} border-l-[3px] rounded-xl p-4 flex items-center gap-4 hover:border-[#D9A441]/40 hover:bg-[#13171C] transition-colors group`}
                    >
                      {/* Photo avec cadre de visée */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full rounded-md bg-[#1A1E23] overflow-hidden border border-[#232931]">
                          {candidate.photo_url ? (
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                            />
                          ) : (
                            <div className={`${mono.className} w-full h-full flex items-center justify-center text-[#3A3F45] font-black text-2xl`}>
                              ?
                            </div>
                          )}
                        </div>
                        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#D9A441]/70" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#D9A441]/70" />
                        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#D9A441]/70" />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#D9A441]/70" />
                      </div>

                      {/* Infos du candidat */}
                      <div className="flex-1 overflow-hidden min-w-0">
                        <h3 className={`${display.className} font-medium text-[#F2EFE9] truncate text-lg leading-tight`}>
                          {candidate.name}
                        </h3>
                        <p className={`${mono.className} text-[#D9A441] font-bold text-sm mt-1 tracking-wide`}>
                          #{candidate.id}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded ${meta.pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL D'ÉDITION */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E11]/80 backdrop-blur-sm">
          <div className="bg-[#11151A] border border-[#232931] p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <h2 className={`${display.className} text-xl font-bold text-[#F2EFE9] mb-4 uppercase tracking-wider`}>
              Éditer Candidat #{editingCandidate.id}
            </h2>
            <form onSubmit={handleUpdateCandidate} className="space-y-4">
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={editingCandidate.name}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                  className="w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] outline-none focus:border-[#D9A441]"
                />
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editingCandidate.phone || ''}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, phone: e.target.value })}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] outline-none focus:border-[#D9A441]`}
                />
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Statut
                </label>
                <select
                  value={editingCandidate.status}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, status: e.target.value })}
                  className={`${mono.className} w-full bg-[#0B0E11] border border-[#232931] rounded-lg p-3 text-[#E8E6E1] outline-none focus:border-[#D9A441]`}
                >
                  <option value="active">En lice (Active)</option>
                  <option value="qualified">Qualifié (Qualified)</option>
                  <option value="eliminated">Éliminé (Eliminated)</option>
                </select>
              </div>
              <div>
                <label className={`${mono.className} block text-[11px] font-bold text-[#9AA0A6] uppercase tracking-wider mb-2`}>
                  Nouvelle Photo (Optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-[#9AA0A6] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-[#D9A441]/30 file:text-xs file:font-bold file:bg-[#D9A441]/10 file:text-[#D9A441] hover:file:bg-[#D9A441]/20 file:transition-colors cursor-pointer"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCandidate(null);
                    setEditFile(null);
                  }}
                  className={`${display.className} flex-1 border border-[#232931] text-[#9AA0A6] hover:bg-[#232931] hover:text-[#E8E6E1] py-3 rounded-lg uppercase tracking-widest font-bold transition-colors`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className={`${display.className} flex-1 bg-[#D9A441] hover:bg-[#C2922F] text-[#0B0E11] py-3 rounded-lg uppercase tracking-widest font-bold disabled:opacity-50 transition-colors`}
                >
                  {editLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}