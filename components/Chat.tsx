
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

    const isAdmin = currentUser.role === UserRole.ADMIN || (currentUser.role as string).toUpperCase() === 'ADMIN';

    // List of users to talk to
    const agents = store.users.filter(u => {
        if (u.id === currentUser.id) return false;
        const role = (u.role as string).toUpperCase();
        return role === 'AGENT' || role === 'ASSISTANT' || role === 'ASSISTANTE' || role === UserRole.AGENT;
    });

    const administrators = store.users.filter(u => {
        if (u.id === currentUser.id) return false;
        const role = (u.role as string).toUpperCase();
        return role === 'ADMIN' || role === 'ADMINISTRATEUR' || role === UserRole.ADMIN;
    });

    const allRecipients = [...agents, ...administrators];
    const filteredRecipients = allRecipients.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto-select broadcast for agents on first open
    useEffect(() => {
        if (!isAdmin && !selectedRecipientId) {
            setSelectedRecipientId('broadcast_admins');
            setShowList(false);
        }
        if (isAdmin && !selectedRecipientId) {
            setSelectedRecipientId('broadcast_agents');
            setShowList(false);
        }
    }, [isAdmin, selectedRecipientId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.messages, isOpen, selectedRecipientId, showList]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !selectedRecipientId) return;

        const msg: Message = {
            id: crypto.randomUUID(),
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
        if (selectedRecipientId === 'broadcast_agents') {
            return m.receiverId === 'broadcast_agents' || m.receiverId === 'broadcast_admins';
        }
        if (selectedRecipientId === 'broadcast_admins') {
            return m.receiverId === 'broadcast_agents' || m.receiverId === 'broadcast_admins';
        }
        // Private conversation
        const isMeSender = m.senderId === currentUser.id && m.receiverId === selectedRecipientId;
        const isMeReceiver = m.senderId === selectedRecipientId && m.receiverId === currentUser.id;
        return isMeSender || isMeReceiver;
    });

    const currentRecipientName = selectedRecipientId === 'broadcast_agents' ? 'Diffusion Agents' :
        selectedRecipientId === 'broadcast_admins' ? 'Support / Admin' :
            store.users.find(u => u.id === selectedRecipientId)?.name || 'Discussion';

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 border-4 border-neutral-900 group"
                >
                    <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {store.messages.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-900 animate-pulse"></span>}
                </button>
            )}

            {isOpen && (
                <div className="bg-neutral-900 border border-neutral-800 w-[380px] h-[550px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            {(!showList && isAdmin) && (
                                <button onClick={() => setShowList(true)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-100">{showList ? 'Contacts' : currentRecipientName}</h3>
                                <p className="text-[9px] text-neutral-500 font-bold uppercase">{showList ? 'Sélectionner un fil' : 'Discussion en direct'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {showList && isAdmin ? (
                        /* User List View (Admins only by default) */
                        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950/30">
                            <div className="p-3 border-b border-neutral-800/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un agent..."
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-red-700"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {/* Broadcast Option */}
                                <button
                                    onClick={() => { setSelectedRecipientId('broadcast_agents'); setShowList(false); }}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedRecipientId === 'broadcast_agents' ? 'bg-red-700 text-white shadow-lg' : 'hover:bg-neutral-800 text-neutral-400'}`}
                                >
                                    <div className={`p-2 rounded-xl ${selectedRecipientId === 'broadcast_agents' ? 'bg-white/20' : 'bg-red-900/20 text-red-500'}`}>
                                        <Filter className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-widest">DIFFUSION GÉNÉRALE</p>
                                        <p className="text-[9px] opacity-60">Visible par tous les agents</p>
                                    </div>
                                </button>

                                <div className="px-2 pt-4 pb-2 text-[9px] font-black uppercase tracking-widest text-neutral-600">Agents & Assistants</div>

                                {filteredRecipients.length === 0 && <p className="text-center py-10 text-xs text-neutral-700 italic">Aucun agent trouvé</p>}

                                {filteredRecipients.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => { setSelectedRecipientId(u.id); setShowList(false); }}
                                        className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${selectedRecipientId === u.id ? 'bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-800/50'}`}
                                    >
                                        <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700 font-black text-xs text-neutral-400">
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs font-bold text-neutral-200 truncate">{u.name}</p>
                                            <p className="text-[9px] text-neutral-500 uppercase font-black">{u.role}</p>
                                        </div>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Messages View */
                        <>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-900/20">
                                {filteredMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4 border border-neutral-700">
                                            <MessageSquare className="w-6 h-6 text-neutral-600" />
                                        </div>
                                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest opacity-40">Début de la discussion</p>
                                    </div>
                                )}
                                {filteredMessages.map(m => {
                                    const isMe = m.senderId === currentUser.id;
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs relative ${isMe ? 'bg-red-700 text-white rounded-tr-none shadow-xl' : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700 shadow-lg'}`}>
                                                {!isMe && (
                                                    <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                                                        <span className="text-[8px] font-black uppercase tracking-widest">{m.senderName}</span>
                                                        {m.senderRole === UserRole.ADMIN ? <Shield className="w-2 h-2" /> : <UserIcon className="w-2 h-2" />}
                                                    </div>
                                                )}
                                                <p className="leading-relaxed font-medium whitespace-pre-wrap">{m.text}</p>
                                                <div className="flex justify-end mt-1.5">
                                                    <span className="text-[7px] opacity-40 font-black">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2 shrink-0">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Message..."
                                    className="flex-1 bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-red-700 text-neutral-200 transition-all font-medium"
                                />
                                <button
                                    disabled={!text.trim() || !selectedRecipientId}
                                    className="p-3.5 bg-red-700 text-white rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:grayscale transition-all active:scale-90 shadow-lg shadow-red-900/20"
                                >
                                    <Send className="w-4 h-4" />
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
