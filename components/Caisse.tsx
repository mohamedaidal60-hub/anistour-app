
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, EntryType, FinancialEntry, CashDesk, MaintenanceStatus } from '../types.ts';
import {
    TrendingUp, TrendingDown, Coins, Plus, Calendar,
    User as UserIcon, History, Wallet, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface CaisseProps {
    store: ReturnType<typeof useFleetStore>;
}

const Caisse: React.FC<CaisseProps> = ({ store }) => {
    const isAdmin = store.currentUser?.role === UserRole.ADMIN;
    const myCaisse = store.cashDesks.find(d => d.userId === store.currentUser?.id);
    const [selectedDeskId, setSelectedDeskId] = useState<string | null>(isAdmin ? (store.cashDesks[0]?.id || null) : (myCaisse?.id || null));
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [fundDescription, setFundDescription] = useState('Approvisionnement Caisse');

    const selectedDesk = store.cashDesks.find(d => d.id === selectedDeskId);
    const deskEntries = store.entries.filter((e: FinancialEntry) => e.cashDeskId === selectedDeskId);
    const sortedEntries = [...deskEntries].sort((a, b) => b.date.localeCompare(a.date));

    const handleFunding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDeskId || !fundAmount) return;

        const entry: FinancialEntry = {
            id: `fund-${Date.now()}`,
            cashDeskId: selectedDeskId,
            date: new Date().toISOString().split('T')[0],
            amount: Number(fundAmount),
            type: EntryType.FUNDING,
            description: fundDescription,
            agentName: store.currentUser?.name || 'Admin',
            status: MaintenanceStatus.APPROVED,
            createdAt: new Date().toISOString()
        };

        await store.addEntry(entry);
        setFundAmount('');
        setShowFundModal(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Desk Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-neutral-900/30 p-8 rounded-[2.5rem] border border-neutral-800">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900/30">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Gestion des Caisses</h2>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Flux monétaires et approvisionnements</p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Choisir :</span>
                        <div className="flex flex-wrap gap-2">
                            {store.cashDesks.map(desk => (
                                <button
                                    key={desk.id}
                                    onClick={() => setSelectedDeskId(desk.id)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedDeskId === desk.id ? 'bg-red-700 border-red-600 text-white shadow-xl' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                                >
                                    {desk.userName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {selectedDesk ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main Balance Card */}
                    <div className="xl:col-span-1 space-y-8">
                        <div className="bg-neutral-950 p-10 rounded-[3rem] border border-neutral-800 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <Wallet className="w-40 h-40 text-white rotate-12" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">Solde Actuel - {selectedDesk.userName}</p>
                            <h3 className="text-6xl font-black text-white tracking-tighter">
                                {(selectedDesk.balance ?? 0).toLocaleString()} <span className="text-2xl text-red-600 ml-1">{CURRENCY}</span>
                            </h3>

                            <div className="mt-10 pt-10 border-t border-neutral-900 flex gap-4">
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowFundModal(true)}
                                        className="flex-1 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-xl"
                                    >
                                        Alimenter la caisse
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] shadow-xl">
                                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Revenus</p>
                                <p className="text-xl font-black text-emerald-500">
                                    {deskEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + (e.amount ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] shadow-xl">
                                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Dépenses</p>
                                <p className="text-xl font-black text-white">
                                    {deskEntries.filter(e => e.type !== EntryType.REVENUE && e.type !== EntryType.FUNDING).reduce((sum, e) => sum + (e.amount ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="xl:col-span-2 bg-neutral-950 border border-neutral-800 rounded-[3rem] p-10 shadow-2xl flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <History className="w-5 h-5 text-red-600" />
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Historique Transactions</h3>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-4">
                            {sortedEntries.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-700 opacity-20 py-20">
                                    <Coins className="w-20 h-20 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Aucune opération détectée</p>
                                </div>
                            ) : (
                                sortedEntries.map(entry => {
                                    const isPositive = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING;
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between p-6 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl hover:bg-neutral-900 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isPositive ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-950/30 border-red-900/40 text-red-500 group-hover:bg-red-600 group-hover:text-white'}`}>
                                                    {entry.type === EntryType.FUNDING ? <Coins className="w-6 h-6" /> : isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-tight">{entry.description}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{new Date(entry.date).toLocaleDateString()}</span>
                                                        <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600">{entry.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-black ${isPositive ? 'text-emerald-500' : 'text-neutral-100'}`}>
                                                    {isPositive ? '+' : '-'}{(entry.amount ?? 0).toLocaleString()} <span className="text-[10px] text-neutral-600 uppercase ml-1">{CURRENCY}</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-40 text-center bg-neutral-950 rounded-[3rem] border border-neutral-800 shadow-2xl">
                    <TrendingUp className="w-20 h-20 text-neutral-800 mx-auto mb-8" />
                    <h3 className="text-xl font-black text-neutral-600 uppercase tracking-widest">Sélectionnez une caisse pour commencer</h3>
                </div>
            )}

            {/* Funding Modal */}
            {showFundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Alimenter la Caisse</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Approvisionnement de {selectedDesk?.userName}</p>
                            </div>
                            <button onClick={() => setShowFundModal(false)} className="w-10 h-10 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleFunding} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Montant à verser ({CURRENCY})</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-neutral-950 border border-neutral-800 p-6 rounded-3xl outline-none focus:border-red-600 text-5xl font-black text-white shadow-2xl"
                                    placeholder="0"
                                    value={fundAmount}
                                    onChange={e => setFundAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Note / Motif</label>
                                <input
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold text-white shadow-xl"
                                    value={fundDescription}
                                    onChange={e => setFundDescription(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-6 bg-red-700 hover:bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-red-900/30 active:scale-95 transition-all mt-4"
                            >
                                Confirmer l'alimentation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Caisse;
