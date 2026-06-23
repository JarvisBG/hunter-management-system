'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JetBrains_Mono, Oswald } from 'next/font/google';

const display = Oswald({ subsets: ['latin'], weight: ['600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'] });

// Définition des onglets de la tour de contrôle du GM
const NAV_ITEMS = [
  { label: 'Intake & Radar', href: '/admin', color: '#D9A441' },
  { label: 'Gestion Épreuves', href: '/admin/epreuves', color: '#D9A441' },
  { label: 'Course (Étape I)', href: '/admin/endurance', color: '#5FA876' },
  { label: 'Duels (Étape II)', href: '/admin/duel', color: '#E0524F' },
  { label: 'Cuisine (Étape III)', href: '/admin/cuisine', color: '#3FAEC4' },
  { label: 'Badges (Étape IV)', href: '/admin/badges', color: '#D9A441' },
  { label: 'Énigmes Terminal', href: '/admin/enigmes', color: '#D9A441' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Détecte quel est l'onglet actuellement actif
  const activeItem = NAV_ITEMS.find(item => pathname === item.href) || NAV_ITEMS[0];

  return (
    <div className="relative z-50 w-full bg-[#11151A] border-b border-[#232931] shadow-xl">
      {/* Barre supérieure principale */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Identifiant GM */}
        <Link href="/admin" className="flex items-center gap-2 group">
          <span className={`${mono.className} text-[#6B7178] text-xs`}>&gt;_</span>
          <span className={`${display.className} text-lg text-[#F2EFE9] tracking-wider uppercase transition-colors group-hover:text-[#D9A441]`}>
            HMS <span className="text-[#D9A441]">//</span> STAFF
          </span>
        </Link>

        {/* Menu Navigation Version Ordinateur */}
        <nav className="hidden xl:flex items-stretch h-full gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${mono.className} relative flex items-center px-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 h-16`}
                style={{
                  borderColor: isActive ? item.color : 'transparent',
                  color: isActive ? item.color : '#6B7178',
                  backgroundColor: isActive ? `${item.color}08` : 'transparent'
                }}
              >
                {/* Coin de ciblage discret au survol */}
                <span className="absolute top-2 left-2 w-1 h-1 border-t border-l border-transparent group-hover:border-[#D9A441]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bouton de bascule Mobile (Hamburger Tactique) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="xl:hidden flex flex-col justify-center items-center w-8 h-8 border border-[#232931] rounded bg-[#0B0E11] text-[#D9A441] focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <div className={`w-4 h-0.5 bg-current transition-all duration-300 ${isOpen ? 'transform rotate-45 translate-y-1' : '-translate-y-0.5'}`} />
          <div className={`w-4 h-0.5 bg-current transition-all duration-300 mt-1 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
          <div className={`w-4 h-0.5 bg-current transition-all duration-300 mt-1 ${isOpen ? 'transform -rotate-45 -translate-y-1' : 'translate-y-0.5'}`} />
        </button>
      </div>

      {/* Menu Déroulant Version Mobile (Optimisé pour les smartphones sur le terrain) */}
      <div
        className={`xl:hidden w-full bg-[#0E1115] border-b border-[#232931] transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`${mono.className} block w-full px-4 py-3 text-xs font-bold uppercase tracking-wide rounded-lg border border-transparent transition-all`}
                style={{
                  backgroundColor: isActive ? `${item.color}10` : 'transparent',
                  borderColor: isActive ? `${item.color}30` : 'transparent',
                  color: isActive ? item.color : '#E8E6E1'
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}