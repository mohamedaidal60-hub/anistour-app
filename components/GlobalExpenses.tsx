import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { Plus, Wallet, TrendingDown, Users, Camera, Upload, X, Save, Printer } from 'lucide-react';
import { GlobalExpense } from '../types.ts';

const GlobalExpenses: React.FC<{ store: any }> = ({ store }) => {
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newExpense, setNewExpense] = useState({
        type: 'LOYER',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        proofPhoto: null as string | null
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const expense: GlobalExpense = {
                id: crypto.randomUUID(),
                type: newExpense.type,
                amount: parseFloat(newExpense.amount),
                date: newExpense.date,
                description: newExpense.description,
                proofPhoto: newExpense.proofPhoto || undefined,
                agentName: store.currentUser?.name,
                cashDeskId: store.cashDesks[0]?.id // Default to Agency Caisse
            };
            await store.addGlobalExpense(expense);
            setShowForm(false);
            setNewExpense({ type: 'LOYER', amount: '', date: new Date().toISOString().split('T')[0], description: '', proofPhoto: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewExpense(prev => ({ ...prev, proofPhoto: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const stats = store.getFinancialStats();
    const formatMoney = (amount: number) => (amount ?? 0).toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' });

    return (
        <div className="space-y-6">
            {/* Header Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-900/20 rounded-lg"><Wallet className="w-5 h-5 text-red-500" /></div>
                        <h3 className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Total Charges Globales</h3>
                    </div>
                    <p className="text-2xl font-black text-neutral-100">{formatMoney(stats.globalExpenses)}</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-900/20 rounded-lg"><Users className="w-5 h-5 text-orange-500" /></div>
                        <h3 className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Véhicules Actifs</h3>
                    </div>
                    <p className="text-2xl font-black text-neutral-100">{stats.activeCount}</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-900/20 rounded-lg"><TrendingDown className="w-5 h-5 text-blue-500" /></div>
                        <h3 className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Coût Mensuel / Véhicule</h3>
                    </div>
                    {(() => {
                        // Calculate Monthly Average
                        const total = stats.globalExpenses;
                        const active = stats.activeCount || 1;
                        // Find first expense date
                        const dates = store.globalExpenses.map((e: GlobalExpense) => new Date(e.date).getTime());
                        const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
                        const now = new Date();
                        // Diff in months (min 1)
                        const diffMonths = Math.max(1, (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1);

                        const monthlyAvg = total / diffMonths;
                        const costPerVeh = monthlyAvg / active;

                        return (
                            <>
                                <p className="text-2xl font-black text-neutral-100">{formatMoney(costPerVeh)}</p>
                                <p className="text-[10px] text-neutral-500 mt-1">Moyenne mensuelle par véhicule actif</p>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Historique des Charges</h2>
                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center p-2 bg-neutral-900 hover:bg-white hover:text-black text-neutral-400 rounded-xl border border-neutral-800 transition-all shadow-lg"
                        title="Imprimer"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                        <Plus className="w-4 h-4" /> Nouvelle Charge
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Ajouter une charge globale</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Type</label>
                                    <select
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none"
                                        value={newExpense.type}
                                        onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}
                                    >
                                        <option value="LOYER">Loyer</option>
                                        <option value="SALAIRE">Salaire</option>
                                        <option value="ELECTRICITE">Électricité</option>
                                        <option value="EAU">Eau</option>
                                        <option value="IMPOTS">Impôts</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Montant (DA)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Description</label>
                                <textarea
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none h-24 resize-none"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="Détails de la dépense..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Justificatif (Photo)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-red-600 hover:bg-neutral-950/50 transition-all min-h-[140px] relative overflow-hidden"
                                >
                                    {newExpense.proofPhoto ? (
                                        <>
                                            <img src={newExpense.proofPhoto} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                <div className="bg-red-600 p-2 rounded-full shadow-lg"><Save className="w-5 h-5 text-white" /></div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">Changer la Photo</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-neutral-800 p-4 rounded-full"><Camera className="w-8 h-8 text-neutral-500" /></div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Scanner le reçu</p>
                                                <p className="text-[8px] text-neutral-600 font-bold mt-1">CLIQUEZ POUR CAPTURER</p>
                                            </div>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" capture="environment" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50' : ''}`}
                                >
                                    {isSubmitting ? '...' : <Plus className="w-4 h-4" />}
                                    {isSubmitting ? 'En cours' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-950 text-neutral-500 border-b border-neutral-800">
                        <tr>
                            <th className="p-6 font-black uppercase text-[10px] tracking-widest">Date & Justif</th>
                            <th className="p-6 font-black uppercase text-[10px] tracking-widest">Classification</th>
                            <th className="p-6 font-black uppercase text-[10px] tracking-widest">Détails de l'opération</th>
                            <th className="p-6 font-black uppercase text-[10px] tracking-widest text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {store.globalExpenses.map((ex: GlobalExpense) => (
                            <tr key={ex.id} className="hover:bg-neutral-800/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center shrink-0">
                                            {ex.proofPhoto ? (
                                                <img
                                                    src={ex.proofPhoto}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                    onClick={() => {
                                                        const w = window.open('about:blank');
                                                        if (w) { w.document.write(`<img src="${ex.proofPhoto}"/>`); w.document.close(); }
                                                    }}
                                                />
                                            ) : (
                                                <Camera className="w-5 h-5 text-neutral-800" />
                                            )}
                                        </div>
                                        <p className="font-mono text-[11px] text-neutral-400">{ex.date}</p>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="px-4 py-1.5 bg-neutral-950 rounded-full text-[9px] font-black uppercase tracking-widest border border-neutral-800 text-neutral-500">
                                        {ex.type}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <p className="font-bold text-neutral-200 uppercase text-xs truncate max-w-[300px]">{ex.description || 'Sans description'}</p>
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Par : {ex.agentName || 'Admin'}</p>
                                </td>
                                <td className="p-6 text-right">
                                    <p className="text-xl font-black text-red-500">
                                        -{ex.amount.toLocaleString()} <span className="text-[10px] text-neutral-600">DA</span>
                                    </p>
                                </td>
                            </tr>
                        ))}
                        {store.globalExpenses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-20 text-center">
                                    <TrendingDown className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Aucune charge enregistrée</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GlobalExpenses;
