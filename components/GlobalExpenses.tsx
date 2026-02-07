import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { Plus, Wallet, TrendingDown, Users, Camera, Printer, Trash2, Edit2, X } from 'lucide-react';
import { GlobalExpense } from '../types.ts';

const GlobalExpenses: React.FC<{ store: any }> = ({ store }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState<GlobalExpense | null>(null);
    const [newExpense, setNewExpense] = useState<{
        type: string;
        amount: string;
        date: string;
        description: string;
        proofPhoto: string;
    }>({
        type: 'LOYER',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        proofPhoto: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const expense: GlobalExpense = editingExpense ? {
            ...editingExpense,
            type: newExpense.type,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            description: newExpense.description,
            proofPhoto: newExpense.proofPhoto
        } : {
            id: crypto.randomUUID(),
            type: newExpense.type,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            description: newExpense.description,
            proofPhoto: newExpense.proofPhoto
        };

        if (editingExpense) {
            await store.updateGlobalExpense(expense);
            setEditingExpense(null);
        } else {
            await store.addGlobalExpense(expense);
        }
        setShowForm(false);
        setNewExpense({ type: 'LOYER', amount: '', date: new Date().toISOString().split('T')[0], description: '', proofPhoto: '' });
    };

    const handleEdit = (ex: GlobalExpense) => {
        setEditingExpense(ex);
        setNewExpense({
            type: ex.type,
            amount: ex.amount.toString(),
            date: ex.date,
            description: ex.description,
            proofPhoto: ex.proofPhoto || ''
        });
        setShowForm(true);
    };

    const stats = store.getFinancialStats();
    const formatMoney = (amount: number) => (amount ?? 0).toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' });

    return (
        <div className="space-y-4 print:space-y-4">
            {/* Header Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl print:bg-white print:border-neutral-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-900/20 rounded-lg print:hidden"><Wallet className="w-4 h-4 text-red-500" /></div>
                        <h3 className="text-neutral-400 font-black text-[10px] uppercase tracking-widest print:text-black">Total Charges Globales</h3>
                    </div>
                    <p className="text-2xl font-black text-neutral-100 print:text-black">{formatMoney(stats.globalExpenses)}</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl print:bg-white print:border-neutral-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-900/20 rounded-lg print:hidden"><Users className="w-4 h-4 text-orange-500" /></div>
                        <h3 className="text-neutral-400 font-black text-[10px] uppercase tracking-widest print:text-black">Véhicules Actifs</h3>
                    </div>
                    <p className="text-2xl font-black text-neutral-100 print:text-black">{stats.activeCount}</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl print:bg-white print:border-neutral-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-900/20 rounded-lg print:hidden"><TrendingDown className="w-4 h-4 text-blue-500" /></div>
                        <h3 className="text-neutral-400 font-black text-[10px] uppercase tracking-widest print:text-black">Coût Mensuel / Véhicule</h3>
                    </div>
                    {(() => {
                        const total = stats.globalExpenses;
                        const active = stats.activeCount || 1;
                        const dates = store.globalExpenses.map((e: GlobalExpense) => new Date(e.date).getTime());
                        const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
                        const now = new Date();
                        const diffMonths = Math.max(1, (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1);
                        const monthlyAvg = total / diffMonths;
                        const costPerVeh = monthlyAvg / active;

                        return (
                            <>
                                <p className="text-2xl font-black text-neutral-100 print:text-black">{formatMoney(costPerVeh)}</p>
                                <p className="text-[9px] text-neutral-500 mt-1 font-bold print:text-neutral-600">Moyenne mensuelle / véhicule</p>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Action Bar */}
            <h2 className="hidden print:block text-2xl font-black uppercase text-black mb-4">Historique des Charges & Frais Généraux</h2>
            <div className="flex justify-between items-center bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 print:hidden">
                <h2 className="text-sm font-black uppercase text-white tracking-widest">Historique Charges</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all shadow-lg active:scale-95 border border-neutral-700"
                        title="Imprimer"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            const now = new Date();
                            const currentMonth = now.getMonth();
                            const currentYear = now.getFullYear();
                            const monthName = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

                            const monthExpenses = store.globalExpenses.filter((e: GlobalExpense) => {
                                const d = new Date(e.date);
                                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                            });

                            const totalGlobal = monthExpenses.reduce((sum: number, e: GlobalExpense) => sum + (e.amount || 0), 0);
                            const activeVehicles = store.vehicles.filter((v: any) => !v.isArchived);

                            if (activeVehicles.length === 0) { alert("Aucun véhicule actif."); return; }
                            if (totalGlobal === 0) { alert("Aucune charge ce mois."); return; }

                            const distributedEntries = store.entries.filter((e: any) =>
                                e.type === 'EXPENSE' && e.description && e.description.includes(`Quote-part Charges Globales - ${monthName}`)
                            );
                            const totalDistributed = distributedEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                            const difference = totalGlobal - totalDistributed;

                            if (Math.abs(difference) < 50) {
                                alert(`Répartition DÉJÀ EFFECTUÉE pour ${monthName}.`);
                                return;
                            }

                            const amountToDistribute = difference;
                            const share = amountToDistribute / activeVehicles.length;

                            if (confirm(`Répartir charges ${monthName} ?\n\nReste à répartir: ${amountToDistribute.toLocaleString()} DA\nVéhicules: ${activeVehicles.length}\nPart/Véhicule: ${share.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA`)) {
                                activeVehicles.forEach(async (v: any) => {
                                    await store.addEntry({
                                        id: `dist-${Date.now()}-${v.id}`,
                                        vehicleId: v.id,
                                        date: new Date().toISOString(),
                                        amount: parseFloat(share.toFixed(2)),
                                        type: 'EXPENSE',
                                        description: `Quote-part Charges Globales - ${monthName}`,
                                        agentName: 'Système',
                                        status: 'APPROVED'
                                    });
                                });
                                alert("Répartition effectuée.");
                            }
                        }}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-neutral-700 uppercase tracking-wide"
                    >
                        <TrendingDown className="w-3.5 h-3.5" /> Répartir
                    </button>
                    <button
                        onClick={() => { setEditingExpense(null); setNewExpense({ type: 'LOYER', amount: '', date: new Date().toISOString().split('T')[0], description: '', proofPhoto: '' }); setShowForm(true); }}
                        className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide shadow-lg shadow-red-900/20"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nouvelle Charge
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase text-white tracking-widest">{editingExpense ? 'Modifier Charge' : 'Ajouter Charge'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Type</label>
                                    <select
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-bold text-white focus:border-red-600 outline-none"
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
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Montant (DA)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-bold text-white focus:border-red-600 outline-none"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-bold text-white focus:border-red-600 outline-none"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Description</label>
                                <textarea
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-bold text-white focus:border-red-600 outline-none h-20 resize-none"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="Détails de la dépense..."
                                />
                            </div>

                            <div className="border-2 border-dashed border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all bg-neutral-950 group"
                                onClick={() => document.getElementById('expense-proof-upload')?.click()}
                            >
                                {newExpense.proofPhoto ? (
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Photo chargée</span>
                                    </div>
                                ) : (
                                    <div className="text-center text-neutral-500 group-hover:text-red-500">
                                        <Camera className="w-5 h-5 mx-auto mb-1 transition-transform group-hover:scale-110" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Ajouter Photo</span>
                                    </div>
                                )}
                                <input
                                    id="expense-proof-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setNewExpense(prev => ({ ...prev, proofPhoto: reader.result as string }));
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Annuler</button>
                                <button type="submit" className="flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-red-900/20">{editingExpense ? 'Sauvegarder' : 'Ajouter'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden print:bg-white print:border-none">
                <table className="w-full text-left">
                    <thead className="bg-neutral-950 text-neutral-500 border-b border-neutral-800 print:bg-white print:border-neutral-300">
                        <tr>
                            <th className="p-3 font-black uppercase text-[9px] tracking-widest print:text-black">Date</th>
                            <th className="p-3 font-black uppercase text-[9px] tracking-widest print:text-black">Type</th>
                            <th className="p-3 font-black uppercase text-[9px] tracking-widest print:text-black">Description</th>
                            <th className="p-3 font-black uppercase text-[9px] tracking-widest text-right print:text-black">Montant</th>
                            <th className="p-3 font-black uppercase text-[9px] tracking-widest text-right print:hidden">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 print:divide-neutral-200">
                        {store.globalExpenses.map((ex: GlobalExpense) => (
                            <tr key={ex.id} className="hover:bg-neutral-800/50 transition-colors print:hover:bg-transparent">
                                <td className="p-3 font-mono text-neutral-400 text-xs font-bold print:text-black">{ex.date}</td>
                                <td className="p-3">
                                    <span className="px-2 py-0.5 bg-neutral-800 rounded text-[9px] font-black uppercase tracking-widest border border-neutral-700 text-neutral-300 print:bg-transparent print:border-neutral-400 print:text-black">
                                        {ex.type}
                                    </span>
                                </td>
                                <td className="p-3 text-neutral-300 text-xs font-bold print:text-black">{ex.description}</td>
                                <td className="p-3 text-right font-black text-red-500 text-sm print:text-black">
                                    - {formatMoney(ex.amount)}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-2 print:hidden">
                                    {ex.proofPhoto && store.currentUser?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => {
                                                const w = window.open('about:blank');
                                                if (w) {
                                                    w.document.write(`<img src="${ex.proofPhoto}" style="max-width: 100%; height: auto;"/>`);
                                                    w.document.close();
                                                }
                                            }}
                                            className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all"
                                            title="Voir"
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {store.currentUser?.role === 'ADMIN' && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(ex)}
                                                className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-amber-500 transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Supprimer cette charge ?')) store.deleteGlobalExpense(ex.id); }}
                                                className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {store.globalExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                                    Aucune charge enregistrée
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
