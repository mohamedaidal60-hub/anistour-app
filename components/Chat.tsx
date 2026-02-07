
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, UserRole, User } from '../types.ts';
import { useFleetStore } from '../store.ts';
import { Send, MessageSquare, X, User as UserIcon, Shield, ChevronLeft, Search, Filter, Megaphone } from 'lucide-react';

interface ChatProps {
    store: ReturnType<typeof useFleetStore>;
}

const BROADCAST_ID = 'BROADCAST_ALL';

const Chat: React.FC<ChatProps> = ({ store }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const [showList, setShowList] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Unread Messages Logic
    const [lastReadTime, setLastReadTime] = useState(() => {
        return localStorage.getItem('chat_last_read') || new Date().toISOString(); // Default to now (read) if new
    });

    const hasUnread = useMemo(() => {
        if (isOpen) return false;
        return store.messages.some(m => new Date(m.timestamp) > new Date(lastReadTime));
    }, [store.messages, lastReadTime, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const now = new Date().toISOString();
            setLastReadTime(now);
            localStorage.setItem('chat_last_read', now);
        }
    }, [isOpen, store.messages]); // Update when messages arrive while open too

    const currentUser = store.currentUser;
    // Early return if no user, but hooks must be called before. 
    // Ideally this check should be higher or hooks should be conditional (not possible), 
    // but since App.tsx handles login check, currentUser should be present.

    const isAdmin = currentUser && (currentUser.role === UserRole.ADMIN || (currentUser.role as string).toUpperCase() === 'ADMIN');

    // Get the primary admin for agents to talk to (fallback to first found admin)
    const primaryAdmin = store.users.find(u => u.role === UserRole.ADMIN) || { id: 'admin_1', name: 'Admin' } as User;

    // List of agents for the admin to select
    const agents = store.users.filter(u => {
        if (!currentUser || u.id === currentUser.id) return false;
        return (u.role as string).toUpperCase() === 'ASSISTANT' || u.role === UserRole.AGENT;
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.messages, isOpen, selectedRecipientId, showList]);

    // Initial setup when opening chat
    useEffect(() => {
        if (isOpen && currentUser) {
            if (isAdmin) {
                setShowList(true);
            } else {
                // Agents are locked to Admin conversation or Broadcast
                setSelectedRecipientId(primaryAdmin.id);
                setShowList(false);
            }
        }
    }, [isOpen, isAdmin]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !selectedRecipientId || !currentUser) return;

        const msg: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentUser.role,
            receiverId: selectedRecipientId,
            text: text.trim(),
            timestamp: new Date().toISOString(),
        };

        await store.sendMessage(msg);
        setText('');
    };

    // FILTER MESSAGES: Critical part for security
    const filteredMessages = store.messages.filter(m => {
        if (!currentUser) return false;

        // 1. Broadcast messages are visible to everyone
        if (selectedRecipientId === BROADCAST_ID) {
            return m.receiverId === BROADCAST_ID;
        }

        // Use the role stored in the message for the sender (more reliable)
        const isSenderAdmin = m.senderRole === UserRole.ADMIN || (m.senderRole as string) === 'ADMIN';

        if (isAdmin) {
            // Admin is looking at a specific agent (selectedRecipientId)
            const isRelatedToAgent = m.senderId === selectedRecipientId || m.receiverId === selectedRecipientId;
            // Any 1-on-1 with this agent and an admin (if agent only talks to admins)
            return isRelatedToAgent && m.receiverId !== BROADCAST_ID;
        } else {
            // Agent is looking at their chat with Admin
            const isMyPrivateChat = m.senderId === currentUser.id || m.receiverId === currentUser.id;
            return isMyPrivateChat && m.receiverId !== BROADCAST_ID;
        }
    });

    const currentChatName = selectedRecipientId === BROADCAST_ID
        ? 'Diffusion Globale'
        : (store.users.find(u => u.id === selectedRecipientId)?.name || 'Canal Direction');

    if (!currentUser) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] print:hidden">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-red-700 text-white rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-105 transition-all active:scale-95 border-4 border-neutral-900 group relative"
                >
                    <MessageSquare className="w-7 h-7" />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-neutral-900 flex items-center justify-center text-[10px] font-black">!</span>
                    )}
                </button>
            )}

            {isOpen && (
                <div className="bg-neutral-900 border border-neutral-800 w-[400px] h-[600px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            {(!showList && isAdmin) && (
                                <button onClick={() => setShowList(true)} className="w-10 h-10 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 rounded-2xl text-neutral-400 transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                                    {showList ? 'Communication Cloud' : currentChatName}
                                </h3>
                                <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                                    {showList ? 'Sélectionner un canal' : 'Liaison Sécurisée & Cryptée'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-red-900/20 rounded-2xl text-neutral-500 hover:text-red-500 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {showList && isAdmin ? (
                        /* ADMIN DIRECTORY */
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-neutral-800">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:border-red-700 transition-all"
                                        placeholder="Rechercher un agent..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {/* Broadcast Option */}
                                <button
                                    onClick={() => { setSelectedRecipientId(BROADCAST_ID); setShowList(false); }}
                                    className="w-full p-5 rounded-[2rem] bg-red-700/10 border border-red-900/20 hover:bg-red-700/20 flex items-center gap-5 transition-all group"
                                >
                                    <div className="w-14 h-14 bg-red-700 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/20">
                                        <Megaphone className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-red-500 uppercase tracking-widest">Diffusion Globale</p>
                                        <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">Notifier toute l'équipe</p>
                                    </div>
                                </button>

                                <div className="p-4 text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">Canaux Individuels</div>

                                {agents.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => { setSelectedRecipientId(u.id); setShowList(false); }}
                                        className="w-full p-5 rounded-[2rem] bg-neutral-950/40 border border-transparent hover:border-neutral-800 hover:bg-neutral-950 flex items-center gap-5 transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center font-black text-neutral-500 group-hover:border-red-700 transition-all">
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{u.name}</p>
                                            <p className="text-[9px] text-neutral-600 font-bold uppercase">{u.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* MESSAGES INTERFACE */
                        <>
                            <div className="p-3 bg-neutral-950/50 flex gap-2 overflow-x-auto border-b border-neutral-800 shrink-0">
                                <button
                                    onClick={() => setSelectedRecipientId(BROADCAST_ID)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedRecipientId === BROADCAST_ID ? 'bg-red-700 text-white shadow-lg shadow-red-900/20' : 'bg-neutral-900 text-neutral-500 hover:text-white'}`}
                                >
                                    <Megaphone className="w-3 h-3 inline mr-2" /> Diffusion
                                </button>
                                {!isAdmin && (
                                    <button
                                        selected-attr={selectedRecipientId === primaryAdmin.id ? 'true' : 'false'}
                                        onClick={() => setSelectedRecipientId(primaryAdmin.id)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedRecipientId === primaryAdmin.id ? 'bg-red-700 text-white shadow-lg shadow-red-900/20' : 'bg-neutral-900 text-neutral-500 hover:text-white'}`}
                                    >
                                        Direction
                                    </button>
                                )}
                            </div>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-neutral-950/20">
                                {filteredMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                        <Shield className="w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun échange archivé</p>
                                    </div>
                                )}
                                {filteredMessages.map((m, idx) => {
                                    const isMe = m.senderId === currentUser.id;
                                    return (
                                        <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[85%] p-5 rounded-[1.8rem] relative shadow-2xl ${isMe ? 'bg-red-700 text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/50'}`}>
                                                {!isMe && (
                                                    <div className="flex items-center gap-2 mb-2 opacity-50">
                                                        <span className="text-[9px] font-black uppercase text-red-500">{m.senderName}</span>
                                                    </div>
                                                )}
                                                <p className="text-[13px] leading-relaxed font-bold break-words">{m.text}</p>
                                                <div className="mt-3 flex justify-end">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-30">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 bg-neutral-950 border-t border-neutral-800 flex gap-3 shrink-0">
                                {(!isAdmin && selectedRecipientId === BROADCAST_ID) ? (
                                    <div className="flex-1 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-600 text-center">
                                        Lecture seule : Canal d'information Admin
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-red-700 transition-all placeholder:text-neutral-700 text-white"
                                            placeholder={selectedRecipientId === BROADCAST_ID ? "Annonce générale..." : "Votre message..."}
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                        />
                                        <button
                                            disabled={!text.trim()}
                                            className="w-14 h-14 bg-red-700 hover:bg-red-600 disabled:opacity-20 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/30 transition-all active:scale-90"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Chat;
