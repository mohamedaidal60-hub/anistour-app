
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, EntryType, FinancialEntry, CashDesk, MaintenanceStatus } from '../types.ts';
import {
    TrendingUp, TrendingDown, Coins, Plus, Calendar,
    User as UserIcon, History, Wallet, ArrowUpRight, ArrowDownLeft, Printer
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
    const [fundDate, setFundDate] = useState(new Date().toISOString().split('T')[0]);

    const selectedDesk = store.cashDesks.find(d => d.id === selectedDeskId);
    const deskEntries = store.entries.filter((e: FinancialEntry) => e.cashDeskId === selectedDeskId);
    const sortedEntries = [...deskEntries].sort((a, b) => b.date.localeCompare(a.date));

    const handleFunding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDeskId || !fundAmount) return;

        const entry: FinancialEntry = {
            id: `fund-${Date.now()}`,
            cashDeskId: selectedDeskId,
            date: fundDate,
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 print:space-y-4">
            {/* Header & Desk Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-neutral-900/30 p-4 rounded-[1.5rem] border border-neutral-800 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Gestion des Caisses</h2>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-0.5">Flux monétaires</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all shadow-md active:scale-95 border border-neutral-700"
                        title="Imprimer"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                            {store.cashDesks.map(desk => (
                                <button
                                    key={desk.id}
                                    onClick={() => setSelectedDeskId(desk.id)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedDeskId === desk.id ? 'bg-red-700 border-red-600 text-white shadow-lg' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                                >
                                    {desk.userName}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedDesk ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
                    {/* Main Balance Card */}
                    <div className="xl:col-span-1 space-y-6 print:mb-6">
                        <div className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 relative overflow-hidden shadow-xl print:bg-white print:border-neutral-300">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none print:hidden">
                                <Wallet className="w-32 h-32 text-white rotate-12" />
                            </div>
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-2 print:text-black">Solde Actuel - {selectedDesk.userName}</p>
                            <h3 className="text-4xl font-black text-white tracking-tighter print:text-black">
                                {(selectedDesk.balance ?? 0).toLocaleString()} <span className="text-lg text-red-600 ml-1 print:text-black">{CURRENCY}</span>
                            </h3>

                            <div className="mt-6 pt-6 border-t border-neutral-900 flex gap-3 print:hidden">
                                <button
                                    onClick={() => setShowFundModal(true)}
                                    className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-lg"
                                >
                                    Alimenter
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 print:hidden">
                            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-[1.5rem] shadow-lg">
                                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Revenus</p>
                                <p className="text-lg font-black text-emerald-500">
                                    {deskEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + (e.amount ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-[1.5rem] shadow-lg">
                                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Dépenses</p>
                                <p className="text-lg font-black text-white">
                                    {deskEntries.filter(e => e.type !== EntryType.REVENUE && e.type !== EntryType.FUNDING).reduce((sum, e) => sum + (e.amount ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="xl:col-span-2 bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 shadow-2xl flex flex-col min-h-[400px] print:bg-white print:border-none print:shadow-none print:p-0">
                        <div className="flex items-center justify-between mb-6 print:mb-4">
                            <div className="flex items-center gap-3">
                                <History className="w-4 h-4 text-red-600 print:text-black" />
                                <h3 className="text-sm font-black uppercase tracking-tighter text-white print:text-black">Historique Transactions</h3>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 print:overflow-visible">
                            {sortedEntries.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-700 opacity-20 py-12">
                                    <Coins className="w-12 h-12 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Aucune opération</p>
                                </div>
                            ) : (
                                sortedEntries.map(entry => {
                                    const isPositive = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING;
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800/50 rounded-xl hover:bg-neutral-900 transition-all group print:bg-white print:border-neutral-200 print:border-b print:rounded-none">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all print:hidden ${isPositive ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-950/30 border-red-900/40 text-red-500 group-hover:bg-red-600 group-hover:text-white'}`}>
                                                    {entry.type === EntryType.FUNDING ? <Coins className="w-4 h-4" /> : isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-tight print:text-black">{entry.description}</p>
                                                    <div className="flex items-center gap-2 mt-1 opacity-60 print:opacity-100">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 print:text-neutral-600">{new Date(entry.date).toLocaleDateString()}</span>
                                                        <div className="w-1 h-1 bg-neutral-700 rounded-full print:bg-black" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-red-600 print:text-black">{entry.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base font-black ${isPositive ? 'text-emerald-500' : 'text-neutral-100'} print:text-black`}>
                                                    {isPositive ? '+' : '-'}{(entry.amount ?? 0).toLocaleString()} <span className="text-[8px] text-neutral-600 uppercase ml-1 print:text-black">{CURRENCY}</span>
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
                <div className="p-20 text-center bg-neutral-950 rounded-[2rem] border border-neutral-800 shadow-xl print:hidden">
                    <TrendingUp className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-neutral-600 uppercase tracking-widest">Sélectionnez une caisse</h3>
                </div>
            )}

            {/* Funding Modal */}
            {showFundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl print:hidden">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Alimenter la Caisse</h3>
                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Pour {selectedDesk?.userName}</p>
                            </div>
                            <button onClick={() => setShowFundModal(false)} className="w-8 h-8 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleFunding} className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Montant ({CURRENCY})</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-3xl font-black text-white shadow-xl"
                                    placeholder="0"
                                    value={fundAmount}
                                    onChange={e => setFundAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Motif</label>
                                <input
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl outline-none focus:border-red-600 text-xs font-bold text-white shadow-lg"
                                    value={fundDescription}
                                    onChange={e => setFundDescription(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Date d'opération</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl outline-none focus:border-red-600 text-xs font-bold text-white shadow-lg"
                                    value={fundDate}
                                    onChange={e => setFundDate(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-red-900/30 active:scale-95 transition-all mt-2"
                            >
                                Confirmer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Caisse;
