
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus, UserRole, FinancialEntry } from '../types.ts';
import { ArrowUpRight, ArrowDownLeft, Wrench, Search, ShieldAlert, User as UserIcon, Coins, Edit3, Check, X } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface JournalProps {
  store: ReturnType<typeof useFleetStore>;
}

const Journal: React.FC<JournalProps> = ({ store }) => {
  const isAgent = store.currentUser?.role === UserRole.AGENT;
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<Partial<FinancialEntry>>({});

  const today = new Date().toISOString().split('T')[0];

  const filteredEntries = store.entries.filter(entry => {
    const entryDate = entry.date.split('T')[0];
    const isToday = entryDate === today;
    const desc = entry.description || entry.designation || '';
    const agent = entry.agentName || entry.userName || '';
    const matchesSearch = desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.toLowerCase().includes(searchTerm.toLowerCase());

    if (isAgent) {
      return isToday && matchesSearch;
    }
    return matchesSearch;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

  const startEdit = (entry: FinancialEntry) => {
    setEditingId(entry.id);
    setEditValue({ ...entry });
  };

  const saveEdit = async () => {
    if (editingId && editValue) {
      // Force status to PENDING for re-validation
      const updatedEntry = { ...editValue, status: MaintenanceStatus.PENDING } as FinancialEntry;
      await store.updateEntry(updatedEntry);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Registre des Opérations</h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-bold">
            {isAgent ? `Vue : Aujourd'hui uniquement` : 'Historique complet du parc Anistour'}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-80 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par description, agent..."
              className="w-full bg-neutral-900 border border-neutral-800 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-red-600 transition-all text-sm font-bold text-white shadow-xl"
            />
          </div>
        </div>
      </div>

      {isAgent && (
        <div className="bg-amber-950/20 border border-amber-900/40 p-5 rounded-[2rem] flex items-center gap-6 shadow-xl">
          <div className="p-3 bg-amber-900/30 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-[11px] text-amber-200/80 font-black uppercase tracking-[0.2em] leading-relaxed">
            Note Agent : Vous pouvez modifier vos saisies du jour. Toute modification nécessitera une nouvelle validation de l'administrateur.
          </p>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 text-[10px] font-black uppercase tracking-[0.25em] border-b border-neutral-800">
                <th className="px-8 py-7">Horodatage</th>
                <th className="px-8 py-7">Véhicule & Index</th>
                <th className="px-8 py-7">Opération & Détails</th>
                <th className="px-8 py-7">Gestionnaire</th>
                <th className="px-8 py-7">Statut</th>
                <th className="px-8 py-7 text-right">Actions / Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {sortedEntries.map(entry => {
                const isRevenue = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING;
                const vehicle = store.vehicles.find(v => v.id === entry.vehicleId);
                const isEditing = editingId === entry.id;

                return (
                  <tr key={entry.id} className="group hover:bg-neutral-800/40 transition-all duration-300">
                    <td className="px-8 py-6">
                      <p className="font-black text-white text-xs">{new Date(entry.createdAt || entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {!isAgent && <p className="text-[9px] mt-1 uppercase text-neutral-600 font-bold">{new Date(entry.date).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-neutral-100 uppercase tracking-tighter text-sm group-hover:text-red-500 transition-colors">{vehicle?.name || 'Général / Agence'}</span>
                      {vehicle && (
                        isEditing ? (
                          <input
                            type="number"
                            className="bg-neutral-950 border border-neutral-700 text-[10px] font-black text-neutral-300 p-1 w-24 rounded mt-1"
                            value={editValue.mileageAtEntry}
                            onChange={(e) => setEditValue({ ...editValue, mileageAtEntry: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="block text-[9px] text-neutral-500 font-black uppercase mt-1 tracking-widest">Index : {(entry.mileageAtEntry ?? 0).toLocaleString()} KM</span>
                        )
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl border ${isRevenue ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-red-950/30 border-red-900/50 text-red-500'}`}>
                          {entry.type === EntryType.FUNDING ? <Coins className="w-4 h-4" /> :
                            isRevenue ? <ArrowUpRight className="w-4 h-4" /> :
                              (entry.type === EntryType.EXPENSE_MAINTENANCE ? <Wrench className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />)}
                        </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <input
                              className="bg-neutral-950 border border-neutral-700 text-xs font-black text-neutral-300 p-1 w-full rounded"
                              value={editValue.description || editValue.designation}
                              onChange={(e) => setEditValue({ ...editValue, description: e.target.value })}
                            />
                          ) : (
                            <span className="text-neutral-200 font-black text-xs uppercase tracking-tight block">{entry.description || entry.designation}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                          <UserIcon className="w-3 h-3 text-red-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider font-bold">{entry.agentName || entry.userName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${entry.status === MaintenanceStatus.PENDING ? 'bg-amber-500 animate-pulse shadow-amber-500/50' : entry.status === MaintenanceStatus.REJECTED ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50 shadow-lg'}`}></div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${entry.status === MaintenanceStatus.PENDING ? 'text-amber-500' : entry.status === MaintenanceStatus.REJECTED ? 'text-red-500' : 'text-emerald-500'}`}>
                          {entry.status === MaintenanceStatus.PENDING ? 'En attente' : entry.status === MaintenanceStatus.REJECTED ? 'Refusé' : 'Validé'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              className="bg-neutral-950 border border-emerald-900 text-emerald-500 font-black text-right p-1 w-24 rounded"
                              value={editValue.amount}
                              onChange={(e) => setEditValue({ ...editValue, amount: Number(e.target.value) })}
                            />
                            <button onClick={saveEdit} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <>
                            {isAgent && (
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-neutral-700 rounded-lg transition-all text-neutral-500 hover:text-white"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <p className={`font-black text-base ${isRevenue ? 'text-emerald-500' : 'text-white'}`}>
                              {isRevenue ? '+' : '-'}{(entry.amount ?? 0).toLocaleString()} <span className="text-[10px] text-neutral-600">{CURRENCY}</span>
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-neutral-950 rounded-2xl flex items-center justify-center mb-4 border border-neutral-800">
                        <Search className="w-6 h-6 text-neutral-800" />
                      </div>
                      <p className="text-neutral-700 text-[10px] font-black uppercase tracking-[0.3em]">Aucune capture aujourd'hui</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Journal;
