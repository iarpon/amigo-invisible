'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  user?: {
    id: string;
    phone: string;
    name: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0c1613]/90 backdrop-blur-md border-b border-[#1f362c]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#14231e] border border-[#2b4437] shadow-md group-hover:scale-105 group-hover:border-[#e4be77]/50 transition-all p-1">
            <Image src="/logo-icon.svg" alt="Amigo Invisible Logo" width={40} height={40} className="w-full h-full object-contain drop-shadow" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#f5f2eb] group-hover:text-[#e4be77] transition-colors">
                Amigo Invisible
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#a88243] bg-[#23352c] px-2 py-0.5 rounded-xs border border-[#3e5649]">
                CONFIDENCIAL
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#8a9f93] tracking-wide hidden sm:block">
              Estafeta de Sorteos & Mensajería Secreta
            </p>
          </div>
        </Link>

        {/* User state / actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#14231e] border border-[#233c31] px-3.5 py-1.5 rounded-full text-xs text-[#ded8cb]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-[#f2efe9]">{user.name}</span>
              <span className="font-mono text-[11px] text-[#7d9287] hidden md:inline">
                ({user.phone})
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Cerrar sesión"
              className="p-2 text-[#8a9f93] hover:text-rose-300 hover:bg-[#182a24] rounded-lg transition-colors border border-transparent hover:border-[#2b4438]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-mono tracking-wider uppercase bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] px-4 py-2 rounded-lg transition-all shadow-md shadow-red-950/40 border border-red-400/30 font-semibold"
          >
            Acceso Secreto
          </Link>
        )}
      </div>
    </header>
  );
}
