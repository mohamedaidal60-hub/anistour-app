
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserRole, User } from '../types.ts';
import { useFleetStore } from '../store.ts';
import { Send, MessageSquare, X, User as UserIcon, Shield } from 'lucide-react';

interface ChatProps {
    store: ReturnType<typeof useFleetStore>;
}

const Chat: React.FC<ChatProps> = ({ store }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentUser = store.currentUser;
    if (!currentUser) return null;

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const admins = store.users.filter(u => u.role === UserRole.ADMIN);
    const agents = store.users.filter(u => u.role === UserRole.AGENT);

    // Default recipient for agent: First Admin
    useEffect(() => {
        if (!isAdmin && admins.length > 0 && !selectedRecipientId) {
            setSelectedRecipientId(admins[0].id);
        }
    }, [isAdmin, admins, selectedRecipientId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.messages, isOpen]);

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
        if (isAdmin) {
            // Admin sees messages they sent OR messages sent to them
            // OR if talking to a specific agent, show that thread
            if (!selectedRecipientId) return false;
            return (m.senderId === currentUser.id && m.receiverId === selectedRecipientId) ||
                (m.senderId === selectedRecipientId && m.receiverId === currentUser.id);
        } else {
            // Agent sees messages between them and the selected admin
            return (m.senderId === currentUser.id && m.receiverId === selectedRecipientId) ||
                (m.senderId === selectedRecipientId && m.receiverId === currentUser.id);
        }
    });

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Chat Bubble Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 border-4 border-neutral-900 group"
                >
                    <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {/* Unread indicator (optional) */}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-neutral-900 border border-neutral-800 w-[350px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-900/20 rounded-lg">
                                <MessageSquare className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-100">Messagerie</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase">Ligne Directe</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Recipient Selector (for Admin) */}
                    {isAdmin && (
                        <div className="p-2 bg-neutral-950/50 border-b border-neutral-800 flex gap-2 overflow-x-auto custom-scrollbar">
                            {agents.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedRecipientId(a.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${selectedRecipientId === a.id ? 'bg-red-700 border-red-600 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    {a.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-900/30">
                        {selectedRecipientId ? (
                            <>
                                {filteredMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4 border border-neutral-700">
                                            <MessageSquare className="w-6 h-6 text-neutral-600" />
                                        </div>
                                        <p className="text-xs text-neutral-500 font-medium italic">Commencez la discussion avec {store.users.find(u => u.id === selectedRecipientId)?.name}</p>
                                    </div>
                                )}
                                {filteredMessages.map(m => {
                                    const isMe = m.senderId === currentUser.id;
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${isMe ? 'bg-red-700 text-white rounded-tr-none shadow-lg' : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'}`}>
                                                <div className="flex items-center gap-1.5 mb-1 mb-1 opacity-60">
                                                    {m.senderRole === UserRole.ADMIN ? <Shield className="w-2.5 h-2.5" /> : <UserIcon className="w-2.5 h-2.5" />}
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{m.senderName}</span>
                                                </div>
                                                <p className="leading-relaxed font-medium">{m.text}</p>
                                                <p className="text-[8px] mt-1.5 opacity-40 text-right">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center p-8">
                                <p className="text-xs text-neutral-600 italic">Sélectionnez un destinataire pour commencer.</p>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="flex-1 bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-xs focus:outline-none focus:border-red-700 text-neutral-200 transition-all"
                        />
                        <button
                            disabled={!text.trim() || !selectedRecipientId}
                            className="p-3 bg-red-700 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chat;
