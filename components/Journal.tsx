
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus, UserRole, FinancialEntry } from '../types.ts';
import { ArrowUpRight, ArrowDownLeft, Wrench, Search, ShieldAlert, User as UserIcon, Coins, Edit3, Check, X, Printer, PrinterIcon } from 'lucide-react';
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
      // Force status to PENDING for re-validation if edited by Agent
      // If Admin edits, it stays APPROVED or validated.
      // But here user only asked for "Admin hand to modify all". 
      // Existing logic forces PENDING. I will keep it for Agent, but for Admin valid immediately.
      const status = store.currentUser?.role === UserRole.ADMIN ? MaintenanceStatus.APPROVED : MaintenanceStatus.PENDING;
      const updatedEntry = { ...editValue, status: status } as FinancialEntry;
      await store.updateEntry(updatedEntry);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <h2 className="hidden print:block text-2xl font-black uppercase text-black mb-4">Registre des Opérations</h2>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/30 p-4 rounded-[1.5rem] border border-neutral-800 print:hidden">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">Registre des Opérations</h2>
          <p className="text-[10px] text-neutral-500 mt-0.5 uppercase tracking-widest font-bold">
            {isAgent ? `Vue : Aujourd'hui uniquement` : 'Historique Complet'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all shadow-md active:scale-95 border border-neutral-700"
            title="Imprimer"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-neutral-950 border border-neutral-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-red-600 transition-all text-xs font-bold text-white shadow-inner"
            />
          </div>
        </div>
      </div>

      {isAgent && (
        <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-[1.5rem] flex items-center gap-4 shadow-lg print:hidden">
          <div className="p-2 bg-amber-900/30 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[9px] text-amber-200/80 font-black uppercase tracking-[0.2em] leading-relaxed">
            Modifications soumises à validation administrateur.
          </p>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-xl backdrop-blur-sm print:bg-white print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-neutral-800 print:bg-white print:border-neutral-300 print:text-black">
                <th className="px-6 py-4 print:px-2 print:py-2">Date</th>
                <th className="px-6 py-4 print:px-2 print:py-2">Véhicule</th>
                <th className="px-6 py-4 print:px-2 print:py-2">Opération</th>
                <th className="px-6 py-4 print:px-2 print:py-2">Agent</th>
                <th className="px-6 py-4 print:px-2 print:py-2">Statut</th>
                <th className="px-6 py-4 text-right print:px-2 print:py-2">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 print:divide-neutral-200">
              {sortedEntries.map(entry => {
                const isRevenue = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING;
                const vehicle = store.vehicles.find(v => v.id === entry.vehicleId);
                const isEditing = editingId === entry.id;

                return (
                  <tr key={entry.id} className="group hover:bg-neutral-800/40 transition-all duration-300 print:hover:bg-transparent">
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      <p className="font-black text-white text-[10px] print:text-black">{new Date(entry.createdAt || entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[8px] mt-0.5 uppercase text-neutral-600 font-bold print:text-neutral-500">{new Date(entry.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      <span className="font-black text-neutral-100 uppercase tracking-tighter text-xs group-hover:text-red-500 transition-colors print:text-black">{vehicle?.name || 'Général'}</span>
                      {vehicle && (
                        isEditing ? (
                          <input
                            type="number"
                            className="bg-neutral-950 border border-neutral-700 text-[10px] font-black text-neutral-300 p-1 w-20 rounded mt-1"
                            value={editValue.mileageAtEntry}
                            onChange={(e) => setEditValue({ ...editValue, mileageAtEntry: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="block text-[8px] text-neutral-500 font-black uppercase mt-0.5 tracking-widest print:text-neutral-600">Idx: {(entry.mileageAtEntry ?? 0).toLocaleString()}</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border print:hidden ${isRevenue ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-red-950/30 border-red-900/50 text-red-500'}`}>
                          {entry.type === EntryType.FUNDING ? <Coins className="w-3.5 h-3.5" /> :
                            isRevenue ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                              (entry.type === EntryType.EXPENSE_MAINTENANCE ? <Wrench className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />)}
                        </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <input
                              className="bg-neutral-950 border border-neutral-700 text-[10px] font-black text-neutral-300 p-1 w-full rounded"
                              value={editValue.description || editValue.designation}
                              onChange={(e) => setEditValue({ ...editValue, description: e.target.value })}
                            />
                          ) : (
                            <span className="text-neutral-200 font-black text-[10px] uppercase tracking-tight block print:text-black">{entry.description || entry.designation}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 print:hidden">
                          <UserIcon className="w-2.5 h-2.5 text-red-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider font-bold print:text-black">{entry.agentName || entry.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full print:hidden ${entry.status === MaintenanceStatus.PENDING ? 'bg-amber-500 animate-pulse' : entry.status === MaintenanceStatus.REJECTED ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.15em] print:text-black ${entry.status === MaintenanceStatus.PENDING ? 'text-amber-500' : entry.status === MaintenanceStatus.REJECTED ? 'text-red-500' : 'text-emerald-500'}`}>
                          {entry.status === MaintenanceStatus.PENDING ? 'Attente' : entry.status === MaintenanceStatus.REJECTED ? 'Refusé' : 'Validé'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap print:px-2 print:py-2">
                      <div className="flex items-center justify-end gap-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="number"
                              className="bg-neutral-950 border border-emerald-900 text-emerald-500 font-black text-right p-1 w-20 rounded text-[10px]"
                              value={editValue.amount}
                              onChange={(e) => setEditValue({ ...editValue, amount: Number(e.target.value) })}
                            />
                            <button onClick={saveEdit} className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            {/* Allow Edit for Validated entries ONLY if Admin */}
                            {(!isAgent || entry.status === MaintenanceStatus.PENDING) && (
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 rounded-lg transition-all text-neutral-500 hover:text-white print:hidden"
                                title="Modifier"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <p className={`font-black text-sm ${isRevenue ? 'text-emerald-500' : 'text-white'} print:text-black`}>
                              {isRevenue ? '+' : '-'}{(entry.amount ?? 0).toLocaleString()} <span className="text-[8px] text-neutral-600 print:text-black">{CURRENCY}</span>
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
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-neutral-950 rounded-xl flex items-center justify-center mb-3 border border-neutral-800">
                        <Search className="w-5 h-5 text-neutral-800" />
                      </div>
                      <p className="text-neutral-700 text-[9px] font-black uppercase tracking-[0.3em]">Aucune transaction</p>
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
