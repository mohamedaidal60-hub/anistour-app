
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserRole, User } from '../types.ts';
import { useFleetStore } from '../store.ts';
import { Send, MessageSquare, X, User as UserIcon, Shield, ChevronLeft, Search, Filter } from 'lucide-react';

interface ChatProps {
    store: ReturnType<typeof useFleetStore>;
}

const Chat: React.FC<ChatProps> = ({ store }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const [showList, setShowList] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentUser = store.currentUser;
    if (!currentUser) return null;

    const isAdmin = currentUser.role === UserRole.ADMIN || (currentUser.role as string).toUpperCase() === 'ADMIN' || (currentUser.role as string).toUpperCase() === 'ADMINISTRATEUR';

    // List of users to talk to
    const agents = store.users.filter(u => {
        if (u.id === currentUser.id) return false;
        const r = (u.role as string).toUpperCase();
        return r === 'AGENT' || r === 'ASSISTANT' || r === 'ASSISTANTE' || r === 'SERVICE' || r === UserRole.AGENT;
    });

    const administrators = store.users.filter(u => {
        if (u.id === currentUser.id) return false;
        const r = (u.role as string).toUpperCase();
        return r === 'ADMIN' || r === 'ADMINISTRATEUR' || r === UserRole.ADMIN;
    });

    const allRecipients = isAdmin ? agents : administrators;
    const filteredRecipients = allRecipients.filter(u =>
        (u.name || 'Agent').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initial view logic
    useEffect(() => {
        if (isOpen) {
            if (isAdmin) {
                // Admins see the user list by default
                setShowList(true);
            } else {
                // Agents talk to Admins by default
                setSelectedRecipientId('broadcast_admins');
                setShowList(false);
            }
        }
    }, [isOpen, isAdmin]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.messages, isOpen, selectedRecipientId, showList]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !selectedRecipientId) return;

        const msg: Message = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
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

    const filteredMessages = store.messages.filter(m => {
        if (selectedRecipientId === 'broadcast_agents' || selectedRecipientId === 'broadcast_admins') {
            // Global thread
            return m.receiverId === 'broadcast_agents' || m.receiverId === 'broadcast_admins';
        }
        // Private conversation
        const isMeSender = m.senderId === currentUser.id && m.receiverId === selectedRecipientId;
        const isMeReceiver = m.senderId === selectedRecipientId && m.receiverId === currentUser.id;
        return isMeSender || isMeReceiver;
    });

    const currentRecipientName = selectedRecipientId === 'broadcast_agents' ? 'Diffusion Globale' :
        selectedRecipientId === 'broadcast_admins' ? 'Support Administration' :
            store.users.find(u => u.id === selectedRecipientId)?.name || 'Discussion';

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 border-4 border-neutral-900 group relative"
                >
                    <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {store.messages.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-900 animate-pulse"></span>}
                </button>
            )}

            {isOpen && (
                <div className="bg-neutral-900 border border-neutral-800 w-[380px] h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            {(!showList && isAdmin) && (
                                <button onClick={() => setShowList(true)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-100">{showList ? 'Contacts Anistour' : currentRecipientName}</h3>
                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{showList ? 'Sélectionner un destinataire' : 'Ligne Directe Cloud'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {showList && isAdmin ? (
                        /* ADMIN LIST VIEW */
                        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950/20">
                            <div className="p-4 border-b border-neutral-800/50">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input
                                        type="text"
                                        placeholder="Filtrer les agents..."
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-11 pr-4 text-xs outline-none focus:border-red-700 font-medium"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {/* Broadcast Option */}
                                <button
                                    onClick={() => { setSelectedRecipientId('broadcast_agents'); setShowList(false); }}
                                    className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all bg-red-950/20 border border-red-900/20 hover:bg-red-900/30 group"
                                >
                                    <div className="p-3 rounded-xl bg-red-700 text-white shadow-lg shadow-red-900/40">
                                        <Filter className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-widest text-red-500">CANAL GÉNÉRAL</p>
                                        <p className="text-[9px] text-neutral-500 font-bold">Visible par toute l'équipe</p>
                                    </div>
                                </button>

                                <div className="px-3 pt-6 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">Agents & Collaborateurs</div>

                                {filteredRecipients.length === 0 && (
                                    <div className="py-10 text-center opacity-40 italic text-xs">Aucun agent disponible</div>
                                )}

                                {filteredRecipients.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => { setSelectedRecipientId(u.id); setShowList(false); }}
                                        className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-neutral-800/50 border border-transparent hover:border-neutral-800 group"
                                    >
                                        <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-full flex items-center justify-center font-black text-sm text-neutral-500 group-hover:border-red-600/50 transition-colors">
                                            {(u.name || 'A').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-sm font-bold text-neutral-100">{u.name || 'Agent'}</p>
                                            <p className="text-[9px] text-neutral-500 font-black uppercase">{u.role}</p>
                                        </div>
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-900/40"></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* MESSAGES VIEW */
                        <>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-neutral-900/30">
                                {filteredMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                        <div className="w-16 h-16 bg-neutral-950 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                                            <MessageSquare className="w-8 h-8 text-neutral-700" />
                                        </div>
                                        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest leading-loose">Début de la liaison cryptée<br />Aucun message pour le moment</p>
                                    </div>
                                )}
                                {filteredMessages.map((m, idx) => {
                                    const isMe = m.senderId === currentUser.id;
                                    return (
                                        <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-3xl relative shadow-xl ${isMe ? 'bg-red-700 text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'}`}>
                                                {!isMe && (
                                                    <div className="flex items-center gap-2 mb-2 opacity-50">
                                                        <span className="text-[9px] font-black uppercase tracking-wider">{m.senderName}</span>
                                                        {m.senderRole === UserRole.ADMIN ? <Shield className="w-2.5 h-2.5" /> : <UserIcon className="w-2.5 h-2.5" />}
                                                    </div>
                                                )}
                                                <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{m.text}</p>
                                                <div className="flex justify-end mt-2">
                                                    <span className="text-[8px] opacity-40 font-black tracking-widest">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-5 bg-neutral-950 border-t border-neutral-800 flex gap-3 shrink-0">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Écrivez ici..."
                                    className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl text-xs focus:outline-none focus:border-red-700 text-neutral-200 transition-all font-bold placeholder:text-neutral-700"
                                />
                                <button
                                    disabled={!text.trim() || !selectedRecipientId}
                                    className="p-4 bg-red-700 text-white rounded-2xl hover:bg-red-600 disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-red-900/30"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Chat;
