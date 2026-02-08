import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { Plus, Wallet, TrendingDown, Users } from 'lucide-react';
import { GlobalExpense } from '../types.ts';

const GlobalExpenses: React.FC<{ store: any }> = ({ store }) => {
    const [showForm, setShowForm] = useState(false);
    const [newExpense, setNewExpense] = useState({
        type: 'LOYER',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const expense: GlobalExpense = {
            id: crypto.randomUUID(),
            type: newExpense.type,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            description: newExpense.description
        };
        await store.addGlobalExpense(expense);
        setShowForm(false);
        setNewExpense({ type: 'LOYER', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
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
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                >
                    <Plus className="w-4 h-4" /> Nouvelle Charge
                </button>
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
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Description</label>
                                <textarea
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none h-24 resize-none"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="Détails de la dépense..."
                                />
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
                                    className="flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-950 text-neutral-500 border-b border-neutral-800">
                        <tr>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Date</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Type</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-widest">Description</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {store.globalExpenses.map((ex: GlobalExpense) => (
                            <tr key={ex.id} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="p-4 font-mono text-neutral-400">{ex.date}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-bold border border-neutral-700">
                                        {ex.type}
                                    </span>
                                </td>
                                <td className="p-4 text-neutral-300">{ex.description}</td>
                                <td className="p-4 text-right font-bold text-red-400">
                                    - {formatMoney(ex.amount)}
                                </td>
                            </tr>
                        ))}
                        {store.globalExpenses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-neutral-500">
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
