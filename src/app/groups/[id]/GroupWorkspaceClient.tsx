'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Coins,
  Users,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Crown,
  RotateCcw,
  Loader2,
  Save,
  MessageSquareQuote,
  Stamp,
  AlertTriangle,
  ShieldBan,
  Shuffle,
  HeartCrack,
  Share2,
  MessageCircle,
} from 'lucide-react';
import RevealCard from '@/components/RevealCard';
import AnonymousChat from '@/components/AnonymousChat';

interface Member {
  id: string;
  userId: string;
  name: string;
  phone: string;
  hasTarget: boolean;
  exclusions: string[];
  createdAt: string;
}

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  budget: string | null;
  eventDate: string | null;
  status: 'DRAFT' | 'DRAWN' | 'FINISHED';
  inviteCode: string;
  organizer: { id: string; name: string; phone: string };
  createdAt: string;
}

interface TargetUser {
  id: string;
  name: string;
  phone: string;
  wishlist: string | null;
}

interface UserProps {
  id: string;
  name: string;
  phone: string;
}

interface ExclusionDisplayRule {
  key: string;
  giverId: string;
  giverName: string;
  receiverId: string;
  receiverName: string;
  isMutual: boolean;
}

export default function GroupWorkspaceClient({
  groupId,
  user,
}: {
  groupId: string;
  user: UserProps;
}) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [myTarget, setMyTarget] = useState<TargetUser | null>(null);
  const [myWishlist, setMyWishlist] = useState('');
  const [savedWishlist, setSavedWishlist] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add participant form
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberMsg, setAddMemberMsg] = useState('');

  // Exclusions rules form
  const [giverUserId, setGiverUserId] = useState('');
  const [receiverUserId, setReceiverUserId] = useState('');
  const [isMutual, setIsMutual] = useState(true);
  const [addingExclusion, setAddingExclusion] = useState(false);
  const [exclusionError, setExclusionError] = useState('');

  // Sorteo actions
  const [drawing, setDrawing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  const getMemberInviteText = useCallback((member: Member) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (group?.status === 'DRAWN') {
      return `¡Hola ${member.name}! Ya se ha realizado el sorteo del Amigo Invisible de «${group?.name}» 🎁.\n\nPara descubrir a tu amigo secreto y chatear de incógnito, entra en:\n${origin}/login\n\nSolo pulsa en 'Activar Invitación' con tu teléfono (${member.phone}) y crea tu contraseña secreta 🤫`;
    }
    return `¡Hola ${member.name}! Te he añadido al Amigo Invisible de «${group?.name}» 🎁.\n\nPara acceder y chatear de incógnito con tu Amigo Secreto, entra aquí:\n${origin}/login\n\nSolo pulsa en 'Activar Invitación' con tu teléfono (${member.phone}) y crea tu contraseña secreta 🤫`;
  }, [group?.name, group?.status]);

  const handleCopyMemberInvite = (member: Member) => {
    navigator.clipboard.writeText(getMemberInviteText(member));
    setCopiedInviteId(member.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const handleWhatsAppMember = (member: Member) => {
    const text = encodeURIComponent(getMemberInviteText(member));
    const cleanNumber = member.phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${text}`, '_blank');
  };

  const handleCopyBroadcast = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text =
      group?.status === 'DRAWN'
        ? `¡Hola a todos! Ya se ha realizado el sorteo del Amigo Invisible de «${group?.name}» 🎁.\n\nAcceded a:\n${origin}/login\n\nPulsad en 'Activar Invitación' e introducid vuestro número de teléfono para descubrir vuestro sobre secreto y chatear de incógnito 🤫`
        : `¡Hola a todos! Ya podéis entrar al Amigo Invisible de «${group?.name}» 🎁.\n\nAcceded a:\n${origin}/login\n\nPulsad en 'Activar Invitación' e introducid vuestro número de teléfono para crear vuestra contraseña y ver vuestro sobre secreto 🤫`;
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al acceder a los registros');
        return;
      }
      const data = await res.json();
      setGroup(data.group);
      setIsOrganizer(data.isOrganizer);
      setMembers(data.members || []);
      setMyTarget(data.myTarget);
      setMyWishlist(data.myWishlist || '');
    } catch {
      setError('Error de conexión con la estafeta');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Derived unique exclusion rules for display
  const activeRules = useMemo(() => {
    const rules: ExclusionDisplayRule[] = [];
    const memberMap = new Map(members.map((m) => [m.userId, m.name]));
    const processedPairs = new Set<string>();

    for (const m of members) {
      const gExclusions = m.exclusions || [];
      for (const targetId of gExclusions) {
        const pairKey = [m.userId, targetId].sort().join(':');
        if (processedPairs.has(pairKey)) continue;

        const targetMember = members.find((other) => other.userId === targetId);
        const isTargetMutual = targetMember?.exclusions?.includes(m.userId) ?? false;

        if (isTargetMutual) {
          processedPairs.add(pairKey);
          rules.push({
            key: pairKey,
            giverId: m.userId,
            giverName: m.name,
            receiverId: targetId,
            receiverName: memberMap.get(targetId) || 'Agente',
            isMutual: true,
          });
        } else {
          rules.push({
            key: `${m.userId}->${targetId}`,
            giverId: m.userId,
            giverName: m.name,
            receiverId: targetId,
            receiverName: memberMap.get(targetId) || 'Agente',
            isMutual: false,
          });
        }
      }
    }
    return rules;
  }, [members]);

  const handleCopyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newName.trim()) return;

    setAddingMember(true);
    setAddMemberMsg('');

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, name: newName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddMemberMsg(data.error || 'Error al añadir al censo');
      } else {
        setNewPhone('');
        setNewName('');
        let msg = 'Agente añadido correctamente al censo.';
        if (data.member?.defaultPasswordGenerated) {
          msg += ` (Su clave provisional de ingreso es "amigo${data.member.phone.slice(-4)}")`;
        }
        setAddMemberMsg(msg);
        fetchGroup();
      }
    } catch {
      setAddMemberMsg('Error de red al añadir agente');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Seguro que deseas dar de baja a este participante antes del sorteo?')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGroup();
      }
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const handleAddExclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverUserId || !receiverUserId || giverUserId === receiverUserId) return;

    setAddingExclusion(true);
    setExclusionError('');

    try {
      const res = await fetch(`/api/groups/${groupId}/exclusions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giverUserId,
          receiverUserId,
          isMutual,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExclusionError(data.error || 'Error al registrar la regla');
      } else {
        setGiverUserId('');
        setReceiverUserId('');
        setIsMutual(true);
        fetchGroup();
      }
    } catch {
      setExclusionError('Error de conexión');
    } finally {
      setAddingExclusion(false);
    }
  };

  const handleRemoveExclusion = async (
    giverId: string,
    receiverId: string,
    mutual: boolean
  ) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/exclusions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giverUserId: giverId,
          receiverUserId: receiverId,
          isMutual: mutual,
        }),
      });

      if (res.ok) {
        fetchGroup();
      }
    } catch (err) {
      console.error('Error removing exclusion rule:', err);
    }
  };

  const handleExecuteDraw = async () => {
    if (members.length < 2) {
      alert('Se requieren al menos 2 participantes para llevar a cabo el sorteo.');
      return;
    }

    if (
      !confirm(
        '¡Atención! Al disparar el sorteo, se sellarán las asignaciones confidenciales respetando todas las reglas de exclusión configuradas. ¿Proceder?'
      )
    ) {
      return;
    }

    setDrawing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/draw`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al formalizar el sorteo');
      } else {
        await fetchGroup();
      }
    } catch {
      alert('Error de conexión al procesar el sorteo');
    } finally {
      setDrawing(false);
    }
  };

  const handleResetDraw = async () => {
    if (
      !confirm(
        '¿Confirmas el reinicio del sorteo? Se destruirán las asignaciones actuales y volverá al estado de convocatoria.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/reset-draw`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchGroup();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveWishlist = async () => {
    setSavingWishlist(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist: myWishlist }),
      });
      if (res.ok) {
        setSavedWishlist(true);
        setTimeout(() => setSavedWishlist(false), 2000);
      }
    } catch (err) {
      console.error('Wishlist save error:', err);
    } finally {
      setSavingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7e978b]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a359] mb-3" />
        <p className="font-mono text-xs">Desclasificando pliego del círculo...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-[#12201b] rounded-3xl p-8 text-center max-w-md mx-auto border-2 border-[#2b483a] mt-10 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-[#d4a359] mx-auto mb-3" />
        <h2 className="font-serif text-xl font-bold text-[#f5f2eb] mb-2">
          {error || 'Círculo no hallado'}
        </h2>
        <p className="font-sans text-xs text-[#809a8c] mb-6">
          No dispones de las credenciales necesarias para este círculo o ha sido archivado.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold bg-[#1b2f26] text-[#e4be77] px-4 py-2.5 rounded-xl border border-[#304d3f] hover:bg-[#253f33] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar al Gabinete</span>
        </Link>
      </div>
    );
  }

  const isDrawn = group.status === 'DRAWN';

  return (
    <div className="space-y-7">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-[#809a8c] hover:text-[#f2efe9] bg-[#12201b] px-3.5 py-1.5 rounded-xl border border-[#22392e] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← VOLVER AL GABINETE</span>
        </Link>

        {isOrganizer && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#e4be77] bg-[#1c3227] px-3.5 py-1 rounded-full border border-[#2e503e]">
            <Crown className="w-3.5 h-3.5 text-[#d4a359]" />
            Rol: Organizador en Jefe
          </span>
        )}
      </div>

      {/* Circle Header Plaque */}
      <div className="bg-[#12201b] rounded-3xl border-2 border-[#22392e] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#192f25] border border-[#2d4d3d] flex items-center justify-center text-xl text-[#d4a359] shadow-inner font-serif font-bold">
                {isDrawn ? '🎁' : '📜'}
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#f5f2eb] tracking-tight">
                  {group.name}
                </h1>
                <p className="font-mono text-xs text-[#809a8c] mt-0.5">
                  Convocado por <strong className="text-[#d8d2c4] font-semibold">{group.organizer.name}</strong>
                </p>
              </div>
            </div>

            {group.description && (
              <p className="font-sans text-xs text-[#95ab9e] mt-3.5 max-w-2xl leading-relaxed">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[#1b3126] font-mono text-xs text-[#7e978b]">
              <span className="flex items-center gap-1.5 bg-[#0d1814] px-3 py-1 rounded-sm border border-[#1e3428]">
                <Users className="w-3.5 h-3.5 text-[#7e978b]" />
                {members.length} miembros en censo
              </span>
              {group.budget && (
                <span className="flex items-center gap-1.5 bg-[#0d1814] px-3 py-1 rounded-sm border border-[#1e3428]">
                  <Coins className="w-3.5 h-3.5 text-[#d4a359]" />
                  Cuota: {group.budget}
                </span>
              )}
              {group.eventDate && (
                <span className="flex items-center gap-1.5 bg-[#0d1814] px-3 py-1 rounded-sm border border-[#1e3428]">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  {new Date(group.eventDate).toLocaleDateString()}
                </span>
              )}
              {activeRules.length > 0 && (
                <span className="flex items-center gap-1.5 bg-[#1c2e25] text-[#e4be77] px-3 py-1 rounded-sm border border-[#30523f]">
                  <ShieldBan className="w-3.5 h-3.5 text-[#d4a359]" />
                  {activeRules.length} regla{activeRules.length === 1 ? '' : 's'} de exclusión
                </span>
              )}
            </div>
          </div>

          {/* Salvoconducto & Status pill */}
          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <span
              className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1 rounded-sm border self-start sm:self-auto ${
                isDrawn
                  ? 'bg-[#153427] text-emerald-300 border-[#235840]'
                  : 'bg-[#2d2716] text-amber-300 border-[#504424]'
              }`}
            >
              {isDrawn ? '● Diligencia Activa' : '○ En Convocatoria'}
            </span>

            <div className="flex items-center gap-2 bg-[#0d1814] border border-[#21372c] px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-[#6d8477]">SALVOCONDUCTO:</span>
              <code className="text-[#f5f2eb] font-bold tracking-wider">
                {group.inviteCode.slice(0, 8)}...
              </code>
              <button
                onClick={handleCopyInvite}
                title="Copiar salvoconducto"
                className="text-[#809a8c] hover:text-[#d4a359] p-1 rounded-md transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWN STATE: REVEAL CARD + WISHLIST + ANONYMOUS CHAT */}
      {isDrawn && (
        <div className="space-y-7">
          {/* Mystery Envelope Reveal Card */}
          {myTarget ? (
            <RevealCard target={myTarget} budget={group.budget} />
          ) : (
            <div className="bg-[#182821] border border-[#2b483a] rounded-2xl p-4 font-mono text-xs text-amber-300">
              Sin asignación directa registrada en este sorteo.
            </div>
          )}

          {/* Participant's Own Wishlist / Hints for their Santa */}
          <div className="bg-[#12201b] rounded-3xl border-2 border-[#22392e] p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#f5f2eb] flex items-center gap-2">
                  <span>💡</span> Tu Tablón de Pistas & Deseos (para quien te regale a ti)
                </h3>
                <p className="font-sans text-xs text-[#809a8c] mt-0.5">
                  Escribe aquí tus gustos, tallas o aficiones. Tu Amigo Invisible verá estas notas dentro de su sobre secreto.
                </p>
              </div>

              <button
                onClick={handleSaveWishlist}
                disabled={savingWishlist}
                className="bg-[#1c3328] hover:bg-[#254234] text-[#e4be77] font-mono text-xs uppercase tracking-wider font-bold px-4 py-2 rounded-xl border border-[#375a47] flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {savingWishlist ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedWishlist ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{savedWishlist ? '¡Guardado en el Tablón!' : 'Guardar en mi Tablón'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={myWishlist}
              onChange={(e) => setMyWishlist(e.target.value)}
              placeholder="Ej. Uso talla M, me encantan los calcetines de lana, el café en grano, la ciencia ficción o cosas de papelería..."
              className="w-full mt-2 p-3.5 bg-[#0a1310] border border-[#21372c] rounded-2xl text-xs sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-sans leading-relaxed"
            />
          </div>

          {/* Anonymous Messaging Engine */}
          <div>
            <div className="mb-3">
              <h2 className="font-serif text-xl font-bold text-[#f5f2eb] flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-[#d4a359]" />
                <span>Estafeta de Cablegramas Cifrados</span>
              </h2>
            </div>
            <AnonymousChat groupId={group.id} targetName={myTarget?.name} />
          </div>

          {/* Organizer Danger Zone: Reset Draw */}
          {isOrganizer && (
            <div className="bg-[#121c18] rounded-3xl border border-[#3b2426] p-6">
              <h4 className="font-mono text-xs uppercase tracking-widest text-rose-300 font-bold mb-1">
                Administración Extraordinaria
              </h4>
              <p className="font-sans text-xs text-[#8a9f93] mb-4">
                Si alguien se incorporó tarde o necesitas reconfigurar el censo y las exclusiones, puedes reiniciar el sorteo a estado de convocatoria.
              </p>
              <button
                onClick={handleResetDraw}
                disabled={resetting}
                className="bg-[#241315] hover:bg-[#33181b] text-rose-300 font-mono text-xs uppercase tracking-wider font-bold px-4 py-2.5 rounded-xl border border-[#7f1d1d] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resetting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Reiniciar Sorteo a Convocatoria</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DRAFT STATE: EXCLUSION RULES + ADD PARTICIPANTS + EXECUTE DRAW */}
      {!isDrawn && (
        <div className="space-y-6">
          {/* Organizer CTA to execute draw */}
          {isOrganizer && (
            <div className="bg-gradient-to-r from-[#8f1920] via-[#a31d25] to-[#7f131a] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-[#b91c1c]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <span className="font-mono text-[10px] tracking-widest uppercase bg-black/25 px-2.5 py-0.5 rounded-sm border border-white/10 text-amber-200">
                  DILIGENCIA LISTA
                </span>
                <h3 className="font-serif text-2xl font-black tracking-tight mt-1">
                  ¿Proceder con el Sorteo Secreto?
                </h3>
                <p className="font-sans text-xs text-red-100/90 mt-1 max-w-md leading-relaxed">
                  El algoritmo resolverá las asignaciones respetando las {activeRules.length} regla{activeRules.length === 1 ? '' : 's'} de exclusión configuradas.
                </p>
              </div>

              <button
                onClick={handleExecuteDraw}
                disabled={drawing || members.length < 2}
                className="bg-[#fef2f2] hover:bg-white text-[#991b24] disabled:opacity-50 font-mono text-xs uppercase tracking-wider font-extrabold px-6 py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/40"
              >
                {drawing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Stamp className="w-4 h-4 text-[#991b24]" />
                )}
                <span>{drawing ? 'Sellando...' : '¡Disparar Sorteo Ahora!'}</span>
              </button>
            </div>
          )}

          {/* If participant and not organizer */}
          {!isOrganizer && (
            <div className="bg-[#182821] border border-[#2d4d3d] rounded-2xl p-6 text-center">
              <p className="font-serif text-base font-bold text-[#f5f2eb]">
                Convocatoria en curso
              </p>
              <p className="font-mono text-xs text-[#7e978b] mt-1">
                El organizador ({group.organizer.name}) está completando el censo de agentes y reglas de sorteo. En cuanto active el sorteo, podrás descubrir tu sobre confidencial.
              </p>
            </div>
          )}

          {/* EXCLUSIONS RULES SECTION (ORGANIZER ONLY) */}
          {isOrganizer && (
            <div className="bg-[#12201b] rounded-3xl border-2 border-[#22392e] p-6 shadow-md">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-serif text-lg font-bold text-[#f5f2eb] flex items-center gap-2">
                  <ShieldBan className="w-4 h-4 text-[#d4a359]" />
                  Reglas de Exclusión (¿A quién no le puede tocar quién?)
                </h3>
                {activeRules.length > 0 && (
                  <span className="font-mono text-[10px] bg-[#1c3328] text-[#e4be77] px-2.5 py-0.5 rounded-sm border border-[#2f5140] font-bold">
                    {activeRules.length} ACTIVA{activeRules.length === 1 ? '' : 'S'}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-[#7e978b] mb-4">
                Ideal para parejas, familiares del mismo domicilio o personas que ya se regalaron en ediciones anteriores.
              </p>

              {exclusionError && (
                <div className="mb-4 p-3 rounded-xl bg-[#2a1315] border border-[#7f1d1d] font-mono text-xs text-rose-300">
                  {exclusionError}
                </div>
              )}

              {/* Exclusion creator form */}
              {members.length < 2 ? (
                <p className="font-mono text-xs text-[#6e877a] italic">
                  Necesitas al menos 2 participantes en el censo para definir reglas de exclusión.
                </p>
              ) : (
                <form
                  onSubmit={handleAddExclusion}
                  className="bg-[#0b1612] p-4 rounded-2xl border border-[#1e3429] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9db2a6] mb-1">
                        A este participante:
                      </label>
                      <select
                        required
                        value={giverUserId}
                        onChange={(e) => setGiverUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#12201b] border border-[#223a2e] rounded-xl text-xs sm:text-sm text-[#f2efe9] focus:outline-hidden focus:border-[#d4a359]"
                      >
                        <option value="">-- Seleccionar Agente --</option>
                        {members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.name} ({m.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9db2a6] mb-1">
                        ⛔ NO le puede tocar regalar a:
                      </label>
                      <select
                        required
                        value={receiverUserId}
                        onChange={(e) => setReceiverUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#12201b] border border-[#223a2e] rounded-xl text-xs sm:text-sm text-[#f2efe9] focus:outline-hidden focus:border-[#d4a359]"
                      >
                        <option value="">-- Seleccionar Destinatario Prohibido --</option>
                        {members
                          .filter((m) => m.userId !== giverUserId)
                          .map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.name} ({m.phone})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 font-mono text-xs text-[#a4b8ad] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isMutual}
                        onChange={(e) => setIsMutual(e.target.checked)}
                        className="rounded-sm border-[#304e3f] bg-[#12201b] text-[#b91c1c] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                      />
                      <span>
                        Regla mutua (tampoco le podrá tocar a la inversa — ej. parejas)
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={addingExclusion || !giverUserId || !receiverUserId}
                      className="px-4 py-2 bg-[#1c3328] hover:bg-[#254234] text-[#e4be77] font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-[#375a47] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 self-end sm:self-auto"
                    >
                      {addingExclusion ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldBan className="w-3.5 h-3.5" />
                      )}
                      <span>Añadir Regla</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Active rules list */}
              {activeRules.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#1b3126]">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#81998c] mb-2.5 font-bold">
                    Reglas en vigor para este sorteo:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeRules.map((rule) => (
                      <div
                        key={rule.key}
                        className="bg-[#0b1612] border border-[#233a2e] text-[#ded8cb] px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2 shadow-inner"
                      >
                        {rule.isMutual ? (
                          <>
                            <span className="font-bold text-[#f5f2eb]">{rule.giverName}</span>
                            <span className="text-[#d4a359] font-bold">⇄</span>
                            <span className="font-bold text-[#f5f2eb]">{rule.receiverName}</span>
                            <span className="text-[10px] uppercase font-bold text-amber-400/90 bg-[#2b2515] px-1.5 py-0.5 rounded-xs border border-[#44381e]">
                              Mutua
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-[#f5f2eb]">{rule.giverName}</span>
                            <span className="text-rose-400 font-bold">⊘ no puede a</span>
                            <span className="font-bold text-[#f5f2eb]">{rule.receiverName}</span>
                          </>
                        )}

                        <button
                          onClick={() =>
                            handleRemoveExclusion(
                              rule.giverId,
                              rule.receiverId,
                              rule.isMutual
                            )
                          }
                          title="Eliminar regla de exclusión"
                          className="text-[#647c70] hover:text-rose-400 p-0.5 transition-colors cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Participant Box (Organizer Only) */}
          {isOrganizer && (
            <div className="bg-[#12201b] rounded-3xl border-2 border-[#22392e] p-6 shadow-md">
              <h3 className="font-serif text-lg font-bold text-[#f5f2eb] mb-1 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#d4a359]" />
                Registrar Agente Manualmente
              </h3>
              <p className="font-mono text-xs text-[#7e978b] mb-4">
                Si un participante no se ha registrado, agrégalo con su teléfono y nombre. Podrá acceder con su teléfono y la clave provisional.
              </p>

              {addMemberMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#182a22] border border-[#2d4d3d] font-mono text-xs text-[#ded8cb]">
                  {addMemberMsg}
                </div>
              )}

              <form
                onSubmit={handleAddMember}
                className="flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 w-full">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9db2a6] mb-1">
                    Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Laura"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-xs sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-sans"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9db2a6] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 654321987"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-xs sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingMember}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-red-400/30 transition-all flex items-center justify-center gap-1.5 h-[42px] shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {addingMember ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Añadir al Censo</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Participants Manifest (Always visible) */}
      <div className="bg-[#12201b] rounded-3xl border-2 border-[#22392e] p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-[#1c3227]">
              <h3 className="font-serif text-lg font-bold text-[#f5f2eb] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4a359]" />
                Censo de Agentes ({members.length})
              </h3>

              {isOrganizer && (
                <button
                  type="button"
                  onClick={handleCopyBroadcast}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#e4be77] hover:text-[#f5f2eb] bg-[#1a2f24] hover:bg-[#233d30] px-3 py-1.5 rounded-lg border border-[#30523f] transition-all cursor-pointer self-start sm:self-auto"
                >
                  {copiedBroadcast ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-[#d4a359]" />
                  )}
                  <span>{copiedBroadcast ? '¡Mensaje Copiado!' : 'Copiar Texto para Grupo de WhatsApp'}</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-[#1b3126]">
              {members.map((m) => {
                const isThisOrganizer = m.userId === group.organizer.id;
                const isMe = m.userId === user.id;
                const exclusionCount = (m.exclusions || []).length;

                return (
                  <div
                    key={m.id}
                    className="py-3 flex items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#182c23] border border-[#2d4d3d] text-[#e4be77] font-serif font-bold flex items-center justify-center text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#f5f2eb]">{m.name}</span>
                          {isMe && (
                            <span className="text-[10px] bg-[#1c3328] text-emerald-300 font-semibold px-2 py-0.2 rounded-xs border border-[#2d503d]">
                              Tú
                            </span>
                          )}
                          {isThisOrganizer && (
                            <span className="text-[10px] bg-[#2d2716] text-[#e4be77] font-semibold px-2 py-0.2 rounded-xs flex items-center gap-1 border border-[#504424]">
                              <Crown className="w-2.5 h-2.5 text-[#d4a359]" /> Organizador
                            </span>
                          )}
                          {exclusionCount > 0 && (
                            <span className="text-[10px] bg-[#221c17] text-amber-300 px-2 py-0.2 rounded-xs border border-[#443522] flex items-center gap-1">
                              <ShieldBan className="w-2.5 h-2.5 text-amber-400" />
                              {exclusionCount} veto{exclusionCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <span className="text-[#647c70] text-[11px]">{m.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOrganizer && !isThisOrganizer && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleWhatsAppMember(m)}
                            title={`Abrir WhatsApp para invitar a ${m.name}`}
                            className="px-2 py-1 bg-[#143224] hover:bg-[#1a4430] text-emerald-300 font-mono text-[11px] rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMemberInvite(m)}
                            title={`Copiar texto de invitación para ${m.name}`}
                            className="p-1.5 text-[#7f988b] hover:text-[#e4be77] hover:bg-[#182c23] rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedInviteId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {!isDrawn && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              title="Eliminar del censo"
                              className="p-1.5 text-[#647c70] hover:text-rose-400 hover:bg-[#201517] rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
