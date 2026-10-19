'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  Calendar,
  Coins,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  Loader2,
  X,
  Stamp,
  FolderLock,
  Crown,
} from 'lucide-react';

interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  budget: string | null;
  eventDate: string | null;
  status: 'DRAFT' | 'DRAWN' | 'FINISHED';
  inviteCode: string;
  organizerId: string;
  organizer: { id: string; name: string };
  _count: { members: number; messages: number };
}

interface UserProps {
  id: string;
  name: string;
  phone: string;
}

export default function DashboardClient({ user }: { user: UserProps }) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('20€');
  const [eventDate, setEventDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, budget, eventDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Error al fundar el círculo');
      } else {
        setShowCreateModal(false);
        setName('');
        setDescription('');
        setBudget('20€');
        setEventDate('');
        fetchGroups();
      }
    } catch {
      setCreateError('Error de red al fundar el círculo');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || 'Salvoconducto no reconocido');
      } else {
        setShowJoinModal(false);
        setInviteCode('');
        fetchGroups();
      }
    } catch {
      setJoinError('Error de red al ingresar en el círculo');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Mission Dispatch Banner */}
      <div className="bg-[#12201b] rounded-3xl p-6 sm:p-9 border-2 border-[#22392e] relative overflow-hidden shadow-2xl">
        {/* Subtle decorative gold badge */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
          <FolderLock className="w-40 h-40 text-[#d4a359]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] tracking-widest uppercase bg-[#1c3328] text-[#d4a359] px-3 py-1 rounded-sm border border-[#2f5140] font-bold">
              ESTADO DE SERVICIO: ACTIVO
            </span>
            <span className="font-mono text-[11px] text-[#748c7f]">
              · {user.phone}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#f5f2eb] tracking-tight">
            Gabinete de {user.name}
          </h1>

          <p className="text-sm text-[#a3b8ad] mt-2.5 leading-relaxed font-sans max-w-xl">
            Desde este centro gestionas tus círculos de regalo, abres tus sobres secretos de asignación y mantienes correspondencia anónima cifrada.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] font-mono text-xs uppercase tracking-wider font-bold px-5 py-3 rounded-xl shadow-lg shadow-red-950/40 border border-red-400/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Fundar Nuevo Círculo</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-[#182c23] hover:bg-[#203a2f] text-[#ded8cb] hover:text-[#f5f2eb] font-mono text-xs uppercase tracking-wider font-bold px-5 py-3 rounded-xl border border-[#2b483a] transition-all flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#d4a359]" />
              <span>Ingresar con Salvoconducto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Circles Dossiers Section */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1c3227]">
          <h2 className="font-serif text-xl font-bold text-[#f2efe9] tracking-tight flex items-center gap-2.5">
            <span>Tus Círculos Registrados</span>
            <span className="font-mono text-xs bg-[#192f25] text-[#d4a359] px-2.5 py-0.5 rounded-sm border border-[#2d4d3d]">
              {groups.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#7e978b]">
            <Loader2 className="w-8 h-8 animate-spin text-[#d4a359] mb-3" />
            <p className="font-mono text-xs">Accediendo a los registros clasificados...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#233a2f] p-12 text-center flex flex-col items-center justify-center bg-[#0e1814]/60">
            <div className="w-16 h-16 rounded-full bg-[#162721] border border-[#2d4c3d] flex items-center justify-center text-3xl mb-4 text-[#d4a359]">
              📯
            </div>
            <h3 className="font-serif font-bold text-xl text-[#f5f2eb]">
              No perteneces a ningún círculo todavía
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#879f92] max-w-sm mt-1.5 mb-6 leading-relaxed">
              Funda el primer círculo secreto para tu familia o amigos, o ingresa mediante el código que te hayan compartido.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] font-mono text-xs uppercase tracking-wider font-bold px-4 py-2.5 rounded-xl border border-red-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Fundar Círculo</span>
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-[#182c23] hover:bg-[#203a2f] text-[#ded8cb] font-mono text-xs uppercase tracking-wider font-bold px-4 py-2.5 rounded-xl border border-[#2b483a] transition-all cursor-pointer"
              >
                Ingresar con código
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((g) => {
              const isOrganizer = g.organizerId === user.id;
              const isDrawn = g.status === 'DRAWN';

              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group bg-[#12201b] hover:bg-[#162721] rounded-2xl border-2 border-[#22392e] hover:border-[#385b49] p-6 shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#f5f2eb] group-hover:text-[#e4be77] transition-colors">
                          {g.name}
                        </h3>
                        {isOrganizer && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#e4be77] bg-[#233529] px-2 py-0.5 rounded-xs mt-1 border border-[#3c5947]">
                            <Crown className="w-3 h-3 text-[#d4a359]" />
                            Organizador en Jefe
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-sm border ${
                          isDrawn
                            ? 'bg-[#153427] text-emerald-300 border-[#235840]'
                            : 'bg-[#2d2716] text-amber-300 border-[#504424]'
                        }`}
                      >
                        {isDrawn ? 'Diligencia Activa' : 'Convocatoria'}
                      </span>
                    </div>

                    {g.description && (
                      <p className="text-xs text-[#8ca396] line-clamp-2 mt-2 leading-relaxed">
                        {g.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#789385] mt-4 pt-3 border-t border-[#1b3126]">
                      <span className="flex items-center gap-1.5 bg-[#0d1814] px-2.5 py-1 rounded-sm border border-[#1e3428]">
                        <Users className="w-3 h-3 text-[#789385]" />
                        {g._count.members} agentes
                      </span>
                      {g.budget && (
                        <span className="flex items-center gap-1.5 bg-[#0d1814] px-2.5 py-1 rounded-sm border border-[#1e3428]">
                          <Coins className="w-3 h-3 text-[#d4a359]" />
                          {g.budget}
                        </span>
                      )}
                      {g.eventDate && (
                        <span className="flex items-center gap-1.5 bg-[#0d1814] px-2.5 py-1 rounded-sm border border-[#1e3428]">
                          <Calendar className="w-3 h-3 text-rose-400" />
                          {new Date(g.eventDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#1b3126] flex items-center justify-between font-mono text-xs">
                    <span className="text-[#647c70]">
                      {isDrawn
                        ? 'Sobres sellados y cablegramas'
                        : 'Lista de participantes'}
                    </span>
                    <span className="text-[#e4be77] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Abrir despacho <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Circle */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12201b] rounded-3xl max-w-md w-full p-6 sm:p-7 border-2 border-[#2b483a] shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-[#789385] hover:text-[#f2efe9] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#f5f2eb] mb-1 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-[#d4a359]" /> Fundar Círculo Secreto
            </h3>
            <p className="font-mono text-xs text-[#809a8c] mb-4">
              Como organizador, gestionarás los participantes y activarás el sorteo cifrado.
            </p>

            {createError && (
              <div className="p-2.5 mb-4 rounded-xl bg-[#2a1315] border border-[#7f1d1d] font-mono text-xs text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1">
                  Nombre del Círculo o Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Círculo Familiar Navidad 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1">
                  Presupuesto Recomendado
                </label>
                <input
                  type="text"
                  placeholder="Ej. 15€, 20-30€, Libre"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1">
                  Fecha de Intercambio de Regalos
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1">
                  Normas o Manifiesto (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones para la entrega de regalos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-mono text-xs font-bold text-[#7d9688] hover:text-[#ded8cb] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-bold bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] rounded-xl border border-red-400/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Registrando...' : 'Fundar Círculo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join Circle */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12201b] rounded-3xl max-w-md w-full p-6 sm:p-7 border-2 border-[#2b483a] shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-[#789385] hover:text-[#f2efe9] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#f5f2eb] mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#d4a359]" /> Salvoconducto de Acceso
            </h3>
            <p className="font-mono text-xs text-[#809a8c] mb-4">
              Introduce el código de invitación que te facilitó el organizador del círculo.
            </p>

            {joinError && (
              <div className="p-2.5 mb-4 rounded-xl bg-[#2a1315] border border-[#7f1d1d] font-mono text-xs text-rose-300">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1">
                  Código de Salvoconducto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. navidad2026 o clave alfa-numérica"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0a1310] border border-[#21372c] rounded-xl text-sm text-[#f2efe9] focus:outline-hidden focus:border-[#d4a359] font-mono text-center tracking-widest uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 font-mono text-xs font-bold text-[#7d9688] hover:text-[#ded8cb] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-bold bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] rounded-xl border border-red-400/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>{joining ? 'Validando...' : 'Unirse al Círculo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
