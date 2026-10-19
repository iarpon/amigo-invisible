'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RefreshCw, Radio, ShieldCheck, Compass } from 'lucide-react';

interface MessageItem {
  id: string;
  isMe: boolean;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ThreadData {
  enabled: boolean;
  partnerLabel: string;
  partnerSubtext: string;
  messages: MessageItem[];
}

interface AnonymousChatProps {
  groupId: string;
  targetName?: string;
}

export default function AnonymousChat({ groupId, targetName }: AnonymousChatProps) {
  const [activeTab, setActiveTab] = useState<'target' | 'santa'>('target');
  const [targetThread, setTargetThread] = useState<ThreadData>({
    enabled: false,
    partnerLabel: targetName || 'Tu Víctima',
    partnerSubtext: '',
    messages: [],
  });
  const [santaThread, setSantaThread] = useState<ThreadData>({
    enabled: false,
    partnerLabel: 'Tu Amigo Invisible 🎅',
    partnerSubtext: '',
    messages: [],
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  const fetchMessages = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setTargetThread(data.targetThread);
        setSantaThread(data.santaThread);
        setErrorMsg('');
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  const currentThread = activeTab === 'target' ? targetThread : santaThread;

  // Scroll to bottom on tab change
  useEffect(() => {
    scrollToBottom(false);
  }, [activeTab, scrollToBottom]);

  // Scroll inside container only if new messages arrive and user is near bottom, or on first load
  useEffect(() => {
    const currentCount = currentThread.messages.length;
    const isNew = currentCount > prevMessagesCountRef.current;
    prevMessagesCountRef.current = currentCount;

    if (!scrollContainerRef.current) return;

    const el = scrollContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;

    if (isInitialLoadRef.current && currentCount > 0) {
      isInitialLoadRef.current = false;
      scrollToBottom(false);
    } else if (isNew && isNearBottom) {
      scrollToBottom(true);
    }
  }, [currentThread.messages, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread: activeTab,
          content: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al transmitir cablegrama');
      } else {
        setInputMessage('');
        await fetchMessages();
        scrollToBottom(true);
      }
    } catch {
      setErrorMsg('Error de conexión en la estafeta');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Intelligence inquiry prompts
  const targetSuggestions = [
    { label: 'Tallas', text: '¿Qué talla de ropa o número de calzado usas?' },
    { label: 'Afición', text: '¿Tienes alguna afición, género de libro o juego favorito?' },
    { label: 'Criterio', text: '¿Prefieres un detalle práctico y útil o una sorpresa divertida?' },
    { label: 'Filtro', text: '¿Hay alguna cosa, color o comida que no te guste nada?' },
  ];

  const santaSuggestions = [
    { label: 'Pista 1', text: '¡Hola Santa! Para darte pistas: me encanta el café y leer.' },
    { label: 'Talla', text: 'Uso talla M de camiseta y 42 de calzado por si te ayuda.' },
    { label: 'Libre', text: 'Cualquier detalle me hará mucha ilusión, no te preocupes.' },
  ];

  const currentSuggestions = activeTab === 'target' ? targetSuggestions : santaSuggestions;

  return (
    <div className="rounded-3xl bg-[#0f1b17] border-2 border-[#233a2f] shadow-xl overflow-hidden flex flex-col h-[640px]">
      {/* Telegraph Console Frequency Selector */}
      <div className="bg-[#14231e] border-b border-[#233a2f] p-3">
        <div className="grid grid-cols-2 gap-2 bg-[#0c1613] p-1 rounded-2xl border border-[#1e342a]">
          <button
            onClick={() => setActiveTab('target')}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'target'
                ? 'bg-[#1e342a] text-[#e4be77] shadow-sm border border-[#3b5b4a]'
                : 'text-[#7e978b] hover:text-[#d1cbc0]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="truncate">Sondear a {targetName || 'mi Víctima'}</span>
            {targetThread.messages.length > 0 && (
              <span className="bg-[#991b24] text-[#fee2e2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {targetThread.messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('santa')}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'santa'
                ? 'bg-[#1e342a] text-[#e4be77] shadow-sm border border-[#3b5b4a]'
                : 'text-[#7e978b] hover:text-[#d1cbc0]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Mi Amigo Secreto</span>
            {santaThread.messages.length > 0 && (
              <span className="bg-[#14532d] text-[#bbf7d0] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {santaThread.messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Security & Protocol Banner */}
        <div className="flex items-center justify-between mt-2.5 px-2">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#86a092]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {activeTab === 'target' ? (
              <span>
                CABLEGRAMA SALIENTE · Firmas como{' '}
                <strong className="text-[#f5f2eb]">«Tu Amigo Invisible 🎅»</strong>
              </span>
            ) : (
              <span>
                CABLEGRAMA ENTRANTE · Hablas con quien{' '}
                <strong className="text-[#f5f2eb]">te regalará a ti</strong>
              </span>
            )}
          </div>

          <button
            onClick={() => fetchMessages(true)}
            disabled={isRefreshing}
            title="Sincronizar mensajes"
            className="p-1 text-[#86a092] hover:text-[#e4be77] hover:bg-[#1b3127] rounded-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-archive-pattern"
      >
        {currentThread.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7e978b]">
            <div className="w-14 h-14 rounded-2xl bg-[#142620] border border-[#274436] flex items-center justify-center text-2xl mb-3 text-[#d4a359]">
              {activeTab === 'target' ? '📜' : '✉️'}
            </div>
            <p className="font-serif font-bold text-lg text-[#f2efe9]">
              {activeTab === 'target'
                ? `Sin despachos previos con ${targetName || 'tu víctima'}`
                : 'Línea abierta con tu Amigo Invisible'}
            </p>
            <p className="font-mono text-xs text-[#7e978b] max-w-sm mt-1 leading-relaxed">
              {activeTab === 'target'
                ? 'Averigua tallas, pasiones o preferencias de incógnito antes de comprar el regalo.'
                : 'Puedes dejarle sugerencias o despejar las dudas de la persona que te regala.'}
            </p>

            {/* Quick Dispatch Starter Chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
              {currentSuggestions.slice(0, 2).map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sugg.text)}
                  className="font-mono text-[11px] bg-[#14231e] hover:bg-[#1e342a] text-[#ded8cb] hover:text-[#e4be77] border border-[#274436] hover:border-[#d4a359]/60 px-3 py-1.5 rounded-lg transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#d4a359] font-bold">[{sugg.label}]</span>
                  <span>&ldquo;{sugg.text}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentThread.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="font-mono text-[10px] tracking-wider uppercase text-[#7e978b]">
                  {msg.senderName}
                </span>
                <span className="font-mono text-[10px] text-[#557063]">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.isMe
                    ? 'bg-[#991b24] text-[#fef2f2] border border-[#b91c1c] shadow-md rounded-tr-xs'
                    : 'bg-[#182c23] text-[#f2efe9] border border-[#2d4d3e] shadow-md rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Intelligence Suggestions Ribbon */}
      {currentThread.messages.length > 0 && (
        <div className="px-4 py-2 bg-[#12201b] border-t border-[#1e342a] flex items-center gap-2 overflow-x-auto">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#d4a359] shrink-0 font-bold flex items-center gap-1">
            <Compass className="w-3 h-3" /> Sondeo:
          </span>
          {currentSuggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sugg.text)}
              className="shrink-0 font-mono text-[11px] bg-[#182c23] hover:bg-[#233d31] hover:text-[#e4be77] text-[#ded8cb] border border-[#284436] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              [{sugg.label}] {sugg.text}
            </button>
          ))}
        </div>
      )}

      {/* Cablegram Input Bar */}
      <div className="p-3.5 bg-[#14231e] border-t border-[#233a2f]">
        {errorMsg && (
          <p className="font-mono text-xs text-rose-300 mb-2 px-1">{errorMsg}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder={
              activeTab === 'target'
                ? `Redactar cablegrama secreto a ${targetName || 'tu víctima'}...`
                : 'Escribir mensaje a tu Amigo Invisible...'
            }
            className="flex-1 bg-[#0c1613] border border-[#264134] rounded-xl px-4 py-2.5 text-sm text-[#f2efe9] placeholder-[#557063] focus:outline-hidden focus:border-[#d4a359] focus:ring-1 focus:ring-[#d4a359]/30 transition-all font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputMessage.trim()}
            className="bg-[#b91c1c] hover:bg-[#a11818] disabled:opacity-40 disabled:hover:bg-[#b91c1c] text-[#fef2f2] font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 font-bold border border-red-400/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transmitir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
