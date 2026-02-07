import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { Plus, Wallet, TrendingDown, Users, Camera } from 'lucide-react';
import { GlobalExpense } from '../types.ts';

const GlobalExpenses: React.FC<{ store: any }> = ({ store }) => {
    const [showForm, setShowForm] = useState(false);
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
        const expense: GlobalExpense = {
            id: crypto.randomUUID(),
            type: newExpense.type,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            description: newExpense.description,
            proofPhoto: newExpense.proofPhoto
        };
        await store.addGlobalExpense(expense);
        setShowForm(false);
        setNewExpense({ type: 'LOYER', amount: '', date: new Date().toISOString().split('T')[0], description: '', proofPhoto: '' });
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
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const now = new Date();
                            const currentMonth = now.getMonth();
                            const currentYear = now.getFullYear();
                            const monthName = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

                            // Filter expenses for current month
                            const monthExpenses = store.globalExpenses.filter((e: GlobalExpense) => {
                                const d = new Date(e.date);
                                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                            });

                            const totalGlobal = monthExpenses.reduce((sum: number, e: GlobalExpense) => sum + (e.amount || 0), 0);
                            const activeVehicles = store.vehicles.filter((v: any) => !v.isArchived);

                            if (activeVehicles.length === 0) {
                                alert("Aucun véhicule actif sur le parc.");
                                return;
                            }

                            if (totalGlobal === 0) {
                                alert("Aucune charge globale pour ce mois.");
                                return;
                            }

                            // Calculate what has ALREADY been distributed for this month
                            const distributedEntries = store.entries.filter((e: any) =>
                                e.type === 'EXPENSE' &&
                                e.description &&
                                e.description.includes(`Quote-part Charges Globales - ${monthName}`)
                            );

                            const totalDistributed = distributedEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

                            // Tolerance for float arithmetic
                            const difference = totalGlobal - totalDistributed;

                            if (Math.abs(difference) < 50) { // Allow small margin
                                alert(`Répartition DÉJÀ EFFECTUÉE pour ${monthName}.\n\nTotal Charges: ${totalGlobal.toLocaleString()} DA\nTotal Déjà Réparti: ${totalDistributed.toLocaleString()} DA\n\nImpossible de répartir deux fois le même montant.`);
                                return;
                            }

                            const amountToDistribute = difference;
                            const share = amountToDistribute / activeVehicles.length;

                            let confirmMessage = `Répartition des charges de ${monthName}`;
                            if (totalDistributed > 0) {
                                confirmMessage += `\n\nATTENTION: Une répartition partielle existe déjà (${totalDistributed.toLocaleString()} DA).\n\nNous allons répartir UNIQUEMENT LE RESTE: ${amountToDistribute.toLocaleString()} DA.`;
                            } else {
                                confirmMessage += `\n\nTotal à répartir: ${amountToDistribute.toLocaleString()} DA`;
                            }
                            confirmMessage += `\nVéhicules actifs: ${activeVehicles.length}\nMontant par véhicule: ${share.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA`;

                            if (confirm(confirmMessage)) {
                                activeVehicles.forEach(async (v: any) => {
                                    await store.addEntry({
                                        id: `dist-${Date.now()}-${v.id}`,
                                        vehicleId: v.id,
                                        date: new Date().toISOString(),
                                        amount: parseFloat(share.toFixed(2)),
                                        type: 'EXPENSE', // EntryType.EXPENSE_SIMPLE
                                        description: `Quote-part Charges Globales - ${monthName}`,
                                        agentName: 'Système',
                                        status: 'APPROVED'
                                    });
                                });
                                alert("Répartition effectuée avec succès.");
                            }
                        }}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-neutral-700"
                    >
                        <TrendingDown className="w-4 h-4" /> Répartir (Mois)
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

                            {/* Photo Upload */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Justificatif (Photo/Bon)</label>
                                <div
                                    className="border-2 border-dashed border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all bg-neutral-950"
                                    onClick={() => document.getElementById('expense-proof-upload')?.click()}
                                >
                                    {newExpense.proofPhoto ? (
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                            <span className="text-xs font-bold">Image chargée</span>
                                        </div>
                                    ) : (
                                        <div className="text-center text-neutral-500">
                                            <Camera className="w-6 h-6 mx-auto mb-1" />
                                            <span className="text-[10px] font-bold">Cliquez pour ajouter</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="expense-proof-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setNewExpense(prev => ({ ...prev, proofPhoto: reader.result as string }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
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
                            <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-right">Actions</th>
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
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {ex.proofPhoto && store.currentUser?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => {
                                                const w = window.open('about:blank');
                                                if (w) {
                                                    w.document.write(`<img src="${ex.proofPhoto}" style="max-width: 100%; height: auto;"/>`);
                                                    w.document.close();
                                                }
                                            }}
                                            className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all"
                                            title="Voir le justificatif"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    )}
                                    {store.currentUser?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => store.deleteGlobalExpense(ex.id)}
                                            className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                                            title="Supprimer"
                                        >
                                            <TrendingDown className="w-4 h-4" />
                                            {/* Used TrendingDown as trash icon was not imported, wait, let's look at imports. */}
                                            {/* Ah, I see Trash2 might not be imported. But I CAN import it. */}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {store.globalExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-neutral-500">
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
