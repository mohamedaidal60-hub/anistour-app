
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { Vehicle, VehicleDocument, EntryType, FinancialEntry } from '../types.ts';
import {
    PieChart, BarChart, FileText, Filter, AlertTriangle,
    Calendar, CheckCircle, Clock, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface ExtraProps {
    store: ReturnType<typeof useFleetStore>;
}

const Extra: React.FC<ExtraProps> = ({ store }) => {
    const [activeTab, setActiveTab] = useState<'BI' | 'GED'>('BI');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    // --- GED Logic ---
    const handleAddDocument = (vId: string) => {
        // Ideally this would open a modal, for now we simulate adding standard docs
        const vehicle = store.vehicles.find(v => v.id === vId);
        if (!vehicle) return;

        const docType = prompt("Type de document (Assurance, Contrôle Tech, Vignette...)");
        if (!docType) return;

        const dateStr = prompt("Date d'expiration (YYYY-MM-DD)");
        if (!dateStr) return;

        const newDoc: VehicleDocument = {
            id: Date.now().toString(),
            type: docType,
            expirationDate: dateStr,
            alertDaysBefore: 30
        };

        const updatedDocs = [...(vehicle.documents || []), newDoc];
        store.updateVehicle({ ...vehicle, documents: updatedDocs });
    };

    const removeDocument = (vId: string, docId: string) => {
        const vehicle = store.vehicles.find(v => v.id === vId);
        if (!vehicle) return;
        const updatedDocs = (vehicle.documents || []).filter(d => d.id !== docId);
        store.updateVehicle({ ...vehicle, documents: updatedDocs });
    };

    // --- BI Logic ---
    const activeVehicles = store.vehicles.filter(v => !v.isArchived);

    // Calculate profitability per vehicle
    const vehicleStats = activeVehicles.map(v => {
        const vEntries = store.entries.filter(e => e.vehicleId === v.id);
        const revenue = vEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + (e.amount || 0), 0);
        const expenses = vEntries.filter(e => e.type !== EntryType.REVENUE).reduce((sum, e) => sum + (e.amount || 0), 0);
        const net = revenue - expenses;
        const km = v.lastMileage || 1; // avoid div by 0
        const costPerKm = expenses / km;
        const profitPerKm = net / km;

        return { ...v, revenue, expenses, net, costPerKm, profitPerKm };
    });

    const bestPerformer = [...vehicleStats].sort((a, b) => b.net - a.net)[0];
    const worstPerformer = [...vehicleStats].sort((a, b) => a.net - b.net)[0];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tab Navigation */}
            <div className="bg-neutral-900/50 p-2 rounded-2xl border border-neutral-800 flex gap-2 w-full md:w-auto self-start">
                <button
                    onClick={() => setActiveTab('BI')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 justify-center ${activeTab === 'BI' ? 'bg-red-700 text-white shadow-lg shadow-red-900/20' : 'text-neutral-500 hover:text-white'}`}
                >
                    <PieChart className="w-4 h-4" /> Analyse & Décisionnel
                </button>
                <button
                    onClick={() => setActiveTab('GED')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 justify-center ${activeTab === 'GED' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-white'}`}
                >
                    <FileText className="w-4 h-4" /> Gestion Documentaire
                </button>
            </div>

            {activeTab === 'BI' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Highlight Cards */}
                    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-16 h-16 text-white" /></div>
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Meilleure Rentabilité</p>
                            {bestPerformer ? (
                                <>
                                    <p className="text-xl font-black text-white mt-1 uppercase truncate">{bestPerformer.name}</p>
                                    <p className="text-emerald-500 font-bold text-sm mt-2">+{bestPerformer.net.toLocaleString()} {CURRENCY}</p>
                                </>
                            ) : <p className="text-neutral-600 italic">N/A</p>}
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown className="w-16 h-16 text-white" /></div>
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Moins Rentable</p>
                            {worstPerformer ? (
                                <>
                                    <p className="text-xl font-black text-white mt-1 uppercase truncate">{worstPerformer.name}</p>
                                    <p className="text-red-500 font-bold text-sm mt-2">{worstPerformer.net.toLocaleString()} {CURRENCY}</p>
                                </>
                            ) : <p className="text-neutral-600 italic">N/A</p>}
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-16 h-16 text-white" /></div>
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Coût Moyen / KM (Flotte)</p>
                            <p className="text-2xl font-black text-white mt-2">
                                {activeVehicles.length > 0 ?
                                    (vehicleStats.reduce((sum, v) => sum + v.costPerKm, 0) / activeVehicles.length).toFixed(2)
                                    : 0} <span className="text-sm text-neutral-600">DA/KM</span>
                            </p>
                        </div>
                    </div>

                    {/* Detailed Stats Table */}
                    <div className="col-span-1 lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-neutral-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Analyse Détaillée par Véhicule</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-950 text-neutral-500 text-[9px] font-black uppercase tracking-widest border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4">Véhicule</th>
                                        <th className="px-6 py-4 text-right">Revenus</th>
                                        <th className="px-6 py-4 text-right">Charges</th>
                                        <th className="px-6 py-4 text-right">Net</th>
                                        <th className="px-6 py-4 text-right">Coût/KM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {vehicleStats.map(v => (
                                        <tr key={v.id} className="hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-xs text-white uppercase">{v.name}</td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-emerald-500">+{v.revenue.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-red-500">-{v.expenses.toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-right text-xs font-black ${v.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{v.net.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-xs text-neutral-400">{v.costPerKm.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* GED Interface */
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden min-h-[600px] flex flex-col lg:flex-row">
                    {/* Sidebar List */}
                    <div className="w-full lg:w-80 border-r border-neutral-800 bg-neutral-950/50 p-4">
                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 px-2">Véhicules Actifs</h3>
                        <div className="space-y-2">
                            {activeVehicles.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVehicleId(v.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${selectedVehicleId === v.id ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden">
                                        <img src={v.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase truncate">{v.name}</p>
                                        <p className="text-[8px] text-neutral-600 font-bold uppercase">{v.registrationNumber}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Document Content */}
                    <div className="flex-1 p-8 bg-neutral-900/50">
                        {selectedVehicleId ? (
                            (() => {
                                const v = store.vehicles.find(v => v.id === selectedVehicleId);
                                if (!v) return null;

                                const docs = v.documents || [];

                                return (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{v.name}</h2>
                                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Dossier Administratif</p>
                                            </div>
                                            <button
                                                onClick={() => handleAddDocument(v.id)}
                                                className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                            >
                                                + Ajouter Document
                                            </button>
                                        </div>

                                        {docs.length === 0 ? (
                                            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-[2rem] opacity-50">
                                                <FileText className="w-10 h-10 text-neutral-700 mb-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Aucun document tracé</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {docs.map(doc => {
                                                    const daysLeft = Math.ceil((new Date(doc.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                    const isExpired = daysLeft < 0;
                                                    const isSoon = daysLeft < 30 && !isExpired;

                                                    return (
                                                        <div key={doc.id} className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl relative group hover:border-neutral-700 transition-all">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-900/20 text-red-500' : isSoon ? 'bg-amber-900/20 text-amber-500' : 'bg-emerald-900/20 text-emerald-500'}`}>
                                                                    {isExpired ? <AlertTriangle className="w-4 h-4" /> : isSoon ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                                </div>
                                                                <button onClick={() => removeDocument(v.id, doc.id)} className="text-neutral-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                                            </div>

                                                            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">{doc.type}</h4>
                                                            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Expire le {new Date(doc.expirationDate).toLocaleDateString()}</p>

                                                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${isExpired ? 'bg-red-600 text-white' : isSoon ? 'bg-amber-600 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                                                                {isExpired ? `Expiré (${Math.abs(daysLeft)}j)` : isSoon ? `Expire dans ${daysLeft}j` : 'Valide'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30">
                                <Filter className="w-12 h-12 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sélectionnez un véhicule</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Internal Import for X Icon
import { X } from 'lucide-react';

export default Extra;
